const {test} = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const {Readable} = require('node:stream');
const {originalProjectVideo,driveId} = require('./projectVideo.cjs');
const id='published-video-12345', bytes=Buffer.from('original-video-content');
async function setup({html=false}={}) {
 const calls=[],app=express();
 app.get('/media/:fileId',originalProjectVideo({loadProjects:async()=>[{demo_video_url:`https://drive.google.com/file/d/${id}/view`}],fetchImpl:async(url,options)=>{
  calls.push({url,range:options.headers.Range});const range=options.headers.Range;const chunk=range?bytes.subarray(2,6):bytes;
  return {status:range?206:200,headers:new Headers({'content-type':html?'text/html':'video/mp4','content-length':String(chunk.length),...(range?{'content-range':`bytes 2-5/${bytes.length}`}:{})}),body:Readable.from(chunk)};
 }}));
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s))});
 return {calls,url:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(resolve=>server.close(resolve))};
}
test('original video bytes and range responses are preserved without transcoding',async()=>{
 const app=await setup();try{
  const full=await fetch(`${app.url}/media/${id}`);assert.equal(full.status,200);assert.equal(full.headers.get('content-disposition'),'inline');assert.deepEqual(Buffer.from(await full.arrayBuffer()),bytes);
  const partial=await fetch(`${app.url}/media/${id}`,{headers:{Range:'bytes=2-5'}});assert.equal(partial.status,206);assert.equal(partial.headers.get('content-range'),`bytes 2-5/${bytes.length}`);assert.deepEqual(Buffer.from(await partial.arrayBuffer()),bytes.subarray(2,6));assert.equal(app.calls[1].range,'bytes=2-5');assert.match(app.calls[0].url,/^https:\/\/drive.usercontent.google.com\/download/);
 }finally{await app.close()}
});
test('unpublished file IDs and invalid ranges cannot create an open media proxy',async()=>{
 const app=await setup();try{
  assert.equal((await fetch(`${app.url}/media/not-published-12345`)).status,404);
  assert.equal((await fetch(`${app.url}/media/${id}`,{headers:{Range:'bytes=0-1,4-5'}})).status,416);assert.equal(app.calls.length,0);
  assert.equal(driveId(`https://example.com/file/d/${id}/view`),null);
 }finally{await app.close()}
});
test('sharing and upstream failures never return HTML as a video',async()=>{
 const app=await setup({html:true});try{assert.equal((await fetch(`${app.url}/media/${id}`)).status,502)}finally{await app.close()}
});
