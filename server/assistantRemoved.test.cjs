const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
test('retired chat routes respond Gone without invoking external services',()=>{
 const source=fs.readFileSync(require.resolve('./index.js'),'utf8');
 const start=source.indexOf("app.all(['/api/chat'");
 const registration=source.slice(start,source.indexOf('\n});',start)+4);
 let handler,paths;vm.runInNewContext(registration,{app:{all:(p,h)=>{paths=p;handler=h}}});
 assert.equal(paths.join(','),'/api/chat,/api/chat/answers');
 for(const method of ['GET','POST','PUT']){
  let status,payload;const res={status:s=>{status=s;return res},json:p=>{payload=p;return res}};
  handler({method,body:{message:'Tell me about Tiago'}},res);assert.equal(status,410);assert.match(payload.error,/removed/);
 }
 assert.doesNotMatch(source,/openrouter\.ai|generateCompletion|synthesizeDatabaseResponse|OPENROUTER_API_KEY/);
});
