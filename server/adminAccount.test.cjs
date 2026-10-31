const {test}=require('node:test');
const assert=require('node:assert/strict');
const {EventEmitter}=require('node:events');
const {createAdminAccount,hashPassword,verifyPassword,createAttemptLimit}=require('./adminAccount.cjs');
function setup(){
 let record=null,fail=false;
 const service=createAdminAccount({bootstrapUsername:'original-owner',bootstrapPassword:'original-test-password',load:async()=>record&&{...record},replace:async(previous,next)=>{
  if(fail)throw Error('Database offline');
  if(record?.credentialVersion!==undefined&&previous.credentialVersion!==record.credentialVersion)return false;
  record={...next};return true;
 },signToken:claims=>JSON.stringify(claims)});
 return {service,record:()=>record,fail:()=>fail=true};
}
test('passwords use independent salts and verify without storing plaintext',async()=>{
 const password='A long test passphrase';const a=await hashPassword(password),b=await hashPassword(password);
 assert.notEqual(a,b);assert.ok(await verifyPassword(password,a));assert.equal(await verifyPassword('wrong',a),false);assert.equal(await verifyPassword(password,'invalid'),false);assert.doesNotMatch(a,/test passphrase/);
});
test('first change migrates environment login; old credentials/sessions never revive',async()=>{
 const {service,record}=setup();const old=JSON.parse((await service.login('original-owner','original-test-password')).token);
 assert.ok(await service.validSession({username:'original-owner'}));
 const saved=await service.change({username:'new-owner',currentPassword:'original-test-password',newPassword:'New test passphrase 123',confirmPassword:'New test passphrase 123'});
 assert.equal(record().username,'new-owner');assert.match(record().passwordHash,/^scrypt\$/);assert.doesNotMatch(JSON.stringify(record()),/original-test-password|New test passphrase/);
 assert.equal(await service.validSession(old),false);assert.ok(await service.validSession(JSON.parse(saved.token)));
 await assert.rejects(service.login('original-owner','original-test-password'),{status:401});await service.login('new-owner','New test passphrase 123');
 assert.deepEqual(Object.keys(await service.currentIdentity()).sort(),['credentialVersion','username']);
 assert.ok(await service.validSession(JSON.parse(await service.issueToken())),'Passkey sessions use current identity/version');
});
test('username-only and password-only changes preserve the other credential',async()=>{
 const {service}=setup();await service.change({username:'new-owner',currentPassword:'original-test-password'});await service.login('new-owner','original-test-password');
 await service.change({currentPassword:'original-test-password',newPassword:'Another test passphrase',confirmPassword:'Another test passphrase'});
 await service.login('new-owner','Another test passphrase');await assert.rejects(service.login('new-owner','original-test-password'),{status:401});
});
test('wrong current password, invalid data and failed persistence do not alter sign-in',async()=>{
 const {service,record,fail}=setup();
 for(const input of [
  {username:'new-owner',currentPassword:'wrong'},
  {username:'bad username',currentPassword:'original-test-password'},
  {username:'new-owner',currentPassword:'original-test-password',newPassword:'short',confirmPassword:'short'},
  {username:'new-owner',currentPassword:'original-test-password',newPassword:'A long test password',confirmPassword:'does not match'},
  {username:'original-owner',currentPassword:'original-test-password'},
 ])await assert.rejects(service.change(input));
 assert.equal(record(),null);fail();await assert.rejects(service.change({username:'new-owner',currentPassword:'original-test-password'}));
 await service.login('original-owner','original-test-password');
});
test('concurrent credential updates cannot overwrite a newer version',async()=>{
 let record={username:'owner',passwordHash:await hashPassword('Original test password'),credentialVersion:1};
 const service=createAdminAccount({load:async()=>({...record}),replace:async(previous,next)=>{if(previous.credentialVersion!==record.credentialVersion)return false;record=next;return true},signToken:JSON.stringify});
 const results=await Promise.allSettled(['first-owner','second-owner'].map(username=>service.change({username,currentPassword:'Original test password'})));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.status,409);
});
test('missing bootstrap configuration fails closed and does not issue a token',async()=>{
 const service=createAdminAccount({load:async()=>null,signToken:()=>{throw Error('Must not sign')}});
 await assert.rejects(service.login(undefined,undefined),{status:401});await assert.rejects(service.login('admin','password'),{status:503});
});
test('attempt limit expires, throttles failures and resets after success',()=>{
 let time=0;const limit=createAttemptLimit({maximum:2,windowMs:1000,now:()=>time});
 function attempt(status=403){let passed=false;const res=new EventEmitter();res.statusCode=status;res.set=()=>res;res.status=s=>{res.statusCode=s;return res};res.json=()=>res;limit({ip:'test-ip'},res,()=>passed=true);res.emit('finish');return {passed,status:res.statusCode}}
 assert.ok(attempt().passed);assert.ok(attempt().passed);assert.equal(attempt().status,429);time=1001;assert.ok(attempt(200).passed);assert.ok(attempt().passed);
});
