import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const clips={};
 for(const [name,width,height] of [['wide',480,270],['tall',270,480]]){
  const encoded=await page.evaluate(async({width,height})=>{const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');ctx.fillStyle='#22455c';ctx.fillRect(0,0,width,height);const stream=c.captureStream(12),r=new MediaRecorder(stream,{mimeType:'video/webm'}),parts=[];r.ondataavailable=e=>parts.push(e.data);const end=new Promise(resolve=>r.onstop=resolve);r.start();const timer=setInterval(()=>{ctx.fillStyle=`hsl(${Date.now()%360},70%,60%)`;ctx.fillRect(20,20,width-40,height-40)},40);await new Promise(resolve=>setTimeout(resolve,500));r.stop();await end;clearInterval(timer);stream.getTracks().forEach(t=>t.stop());return btoa(String.fromCharCode(...new Uint8Array(await new Blob(parts).arrayBuffer())))},{width,height});
  clips[name]=Buffer.from(encoded,'base64');
 }
 await page.route('**/api/**',r=>r.fulfill({status:503,body:'offline'}));
 const images=['/adapt-wide.svg','/adapt-tall.svg','/adapt-square.svg'];
 const projects=[{_id:'images',name:'Image ratios',order:0,enabled:true,description:'Complete uncropped screenshots.',images,tags:[]},...['wide','tall'].map((type,index)=>({_id:type,name:`${type} video`,order:index+1,enabled:true,description:'An original video.',images:[],tags:[],demo_video_url:`/adapt-${type}.webm`}))];
 await page.route('**/api/projects',r=>r.fulfill({json:projects}));
 await page.route('**/api/certifications',r=>r.fulfill({json:[{_id:'cert',name:'Credential ratios',order:0,enabled:true,description:'Original pages.',images,tags:[]}]}));
 await page.route('**/adapt-*.svg',r=>{const type=new URL(r.request().url()).pathname.split('-')[1].split('.')[0],size={wide:[1600,800],tall:[800,1600],square:[1000,1000]}[type];return r.fulfill({contentType:'image/svg+xml',body:`<svg xmlns="http://www.w3.org/2000/svg" width="${size[0]}" height="${size[1]}"><rect width="100%" height="100%" fill="#21465c"/><text x="20" y="80" font-size="42" fill="white">Complete ${type} media</text></svg>`})});
 await page.route('**/adapt-*.webm',r=>r.fulfill({contentType:'video/webm',body:clips[r.request().url().includes('wide')?'wide':'tall']}));
 const verify=async(selector,ratio)=>{
  await page.waitForFunction(({selector,ratio})=>{const el=document.querySelector(selector);if(!el)return false;const r=el.getBoundingClientRect();return r.width>0&&Math.abs(r.width/r.height-ratio)<.025},{selector,ratio},{timeout:5000}).catch(async error=>{console.log(await page.locator(".project-stage,.project-window,.project-window img").evaluateAll(es=>es.map(e=>({class:e.className,width:e.clientWidth,height:e.clientHeight,natural:[e.naturalWidth,e.naturalHeight],style:e.getAttribute("style"),cols:getComputedStyle(e).gridTemplateColumns}))));throw error});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
  const m=await page.locator(selector).evaluate(e=>{const r=e.getBoundingClientRect();return {ratio:r.width/r.height,height:r.height,fit:getComputedStyle(e).objectFit}});assert.equal(m.fit,'contain');
 };
 for(const width of [390,1366,2556]){
  await page.setViewportSize({width,height:width===2556?1392:844});
  for(const view of ['work','certifications']){
   await page.goto('about:blank');
   await page.goto(`http://127.0.0.1:5173/#${view}`);
   const image= view==='work'?'.project-screenshot img':'.credential-preview img';
   for(const [i,ratio]of [2,.5,1].entries()){
    await verify(image,ratio);
    if(i<2)await page.getByRole('button',{name:view==='work'?'Next screenshot':'Next credential page',exact:true}).click();
   }
  }
  await page.goto('http://127.0.0.1:5173/#work');
  await page.locator('.project-screenshot').waitFor();
  for(const [index,ratio]of [[1,16/9],[2,9/16]]){
   if(width<1024){await page.getByRole('button',{name:'Choose project',exact:true}).click();await page.locator('.mobile-picker-options>button').nth(index).click()}else await page.locator('.project-index-item').nth(index).click();
   await verify('video.project-demo-video',ratio);
  }
  console.log(`PASS ${width}px: frames follow landscape, portrait and square images/credentials, plus decoded video dimensions; no crop or overflow`);
 }
 await page.route('**/api/projects',r=>r.fulfill({json:[{_id:'empty',name:'No media yet',enabled:true,images:[],tags:[]}]}));
 await page.goto('about:blank');await page.goto('http://127.0.0.1:5173/#work');await page.locator('.project-media-empty').waitFor();
 await page.route('**/api/certifications',r=>r.fulfill({json:[{_id:'empty',name:'No credential scan yet',enabled:true,images:[],tags:[]}]}));
 await page.goto('about:blank');await page.goto('http://127.0.0.1:5173/#certifications');await page.locator('.project-media-empty').waitFor();
 console.log('PASS archives without media retain their empty states');
 assert.deepEqual(errors,[]);
}finally{await browser.close()}
