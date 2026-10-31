const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const express=require('express');
const jwt=require('jsonwebtoken');
const {createAdminAccount,createAttemptLimit}=require('./adminAccount.cjs');
const source=fs.readFileSync(require.resolve('./index.js'),'utf8');
const routes=source.slice(source.indexOf('const adminAccount ='),source.indexOf('// Passkey configuration'));
const middleware=source.slice(source.indexOf('async function auth('),source.indexOf('// WebAuthn Registration'));
async function setup(){
 const state={record:null,failWrite:false},app=express(),secret='test-only-route-signing-key';app.use(express.json());
 const AdminAccount={
  findOne:()=>({select:()=>({lean:async()=>state.record&&{...state.record}})}),
  create:async data=>{if(state.failWrite)throw Error('Private database error');if(state.record)throw Object.assign(Error('duplicate'),{code:11000});state.record={...data}},
  findOneAndUpdate:async(query,update)=>{if(state.failWrite)throw Error('Private database error');if(state.record?.credentialVersion!==query.credentialVersion)return null;state.record={...state.record,...update.$set};return state.record},
 };
 vm.runInNewContext(routes+middleware,{app,AdminAccount,ACCOUNT_ID:'portfolio-admin',createAdminAccount,createAttemptLimit,jwt,SECRET:secret,process:{env:{ADMIN_USERNAME:'original-owner',ADMIN_PASSWORD:'original-test-password'}}});
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s))});
 return {state,secret,url:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(resolve=>server.close(resolve))};
}
test('real login/account routes require authentication and rotate credentials and sessions',async()=>{
 const app=await setup();try{
  const call=async(path,token,body)=>{const r=await fetch(app.url+path,{method:body?'PUT':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,body:await r.text(),cache:r.headers.get('cache-control')}};
  assert.equal((await call('/api/admin/account')).status,401);
  const login=await fetch(app.url+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'original-owner',password:'original-test-password'})});assert.equal(login.status,200);const old=(await login.json()).token;
  const profile=await call('/api/admin/account',old);assert.equal(profile.status,200);assert.equal(profile.cache,'no-store');assert.doesNotMatch(profile.body,/password|hash/i);
  assert.equal((await call('/api/admin/account',old,{username:'new-owner',currentPassword:'wrong'})).status,403);
  const changed=await call('/api/admin/account',old,{username:'new-owner',currentPassword:'original-test-password',newPassword:'New original passphrase',confirmPassword:'New original passphrase'});assert.equal(changed.status,200);assert.equal(changed.cache,'no-store');const data=JSON.parse(changed.body);assert.equal(jwt.verify(data.token,app.secret).credentialVersion,1);assert.doesNotMatch(changed.body,/scrypt|passphrase/);
  assert.equal((await call('/api/admin/account',old)).status,401);assert.equal((await call('/api/admin/account',data.token)).status,200);
  for(const [username,password,status]of [['original-owner','original-test-password',401],['new-owner','New original passphrase',200]]){const r=await fetch(app.url+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});assert.equal(r.status,status)}
 }finally{await app.close()}
});
test('a failed database save preserves the old login and does not expose errors',async()=>{
 const app=await setup();try{
  app.state.failWrite=true;const token=jwt.sign({username:'original-owner'},app.secret);
  const r=await fetch(app.url+'/api/admin/account',{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({username:'new-owner',currentPassword:'original-test-password'})});assert.equal(r.status,503);assert.doesNotMatch(await r.text(),/Private database error/);assert.equal(app.state.record,null);
  const login=await fetch(app.url+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'original-owner',password:'original-test-password'})});assert.equal(login.status,200);
 }finally{await app.close()}
});
