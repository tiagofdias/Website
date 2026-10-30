import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('**/api/**',r=>r.fulfill({status:503,body:'offline'}));
 for(const [width,height] of [[1920,1080],[1821,931],[1536,864],[1440,900],[1366,768],[1280,720],[1024,700]]){
  await p.setViewportSize({width,height});
  for(const view of ['home','experience','about','contact','cv']){
   await p.goto(`http://127.0.0.1:5173/${view==='cv'?'cv':`#${view}`}`);await p.locator('h1').waitFor();await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(100);
   const m=await p.evaluate(()=>{const main=document.querySelector('main'),dock=document.querySelector('.interface-bottom'),r=main.getBoundingClientRect();return {document:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth,main:{top:r.top,bottom:r.bottom,height:r.height,scroll:main.scrollHeight,client:main.clientHeight},dock:dock.getBoundingClientRect().top}});
   assert.ok(m.document<=height+1,`${width} ${view}: page overflow ${JSON.stringify(m)}`);assert.ok(m.width<=width+1,`${width} ${view}: horizontal overflow`);assert.ok(m.main.bottom<=m.dock+1,`${width} ${view}: dock overlaps main`);
   if(view==='home'){
    const blocks=await p.locator('.introduction,.quick-dossier,.neural-visual,.stage-footer').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {class:e.className,top:r.top,bottom:r.bottom,left:r.left,right:r.right}}));
    for(const block of blocks){assert.ok(block.top>=m.main.top-1&&block.bottom<=m.main.bottom+1,`${width} home: clipped ${JSON.stringify(block)} ${JSON.stringify(m)}`);assert.ok(block.left>=0&&block.right<=width+1,`${width} home: horizontal clipping`)}
   }
   if(view==='experience'){
    const timeline=p.locator('.career-timeline');await timeline.evaluate(e=>e.scrollTop=e.scrollHeight);assert.ok(await timeline.evaluate(e=>e.scrollTop>0),'Career details stay scrollable');await timeline.evaluate(e=>e.scrollTop=0);
   }
   if(view==='about'){
    await p.locator('main').evaluate(e=>e.scrollTop=e.scrollHeight);const action=await p.getByRole('button',{name:/View certifications/}).boundingBox();assert.ok(action.y+action.height<=m.dock+1,'All profile content remains reachable');
    await p.getByRole('button',{name:/^Contact/}).click();await p.waitForFunction(()=>document.querySelector('main').scrollTop===0);await p.locator('.explorer-dock>button').nth(3).click();await p.locator('.human-layout').waitFor();
   }
   if(view==='contact'){
    const send=await p.getByRole('button',{name:/Send a message/}).boundingBox();assert.ok(send.y+send.height<=m.dock+1,`${width}: contact action below fold`);
   }
   if(width===1366&&view!=='cv')await p.screenshot({path:`docs/design/desktop-fit-${view}.png`});
  }
  console.log(`PASS ${width}x${height}: homepage, Career, About, Contact and CV share viewport frame; actions/content reachable`);
 }
 assert.deepEqual(errors,[]);
}finally{await b.close()}
