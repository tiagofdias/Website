import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="750"><rect width="1100" height="750" fill="#f2f4f8"/><text x="100" y="200" font-size="48">Microsoft certification</text></svg>';
try {
 for (const kind of ['work','certifications']) {
  const page = await browser.newPage({viewport:{width:1366,height:768}});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/**',r=>r.fulfill({status:503,body:'offline'}));
  const endpoint=kind==='work'?'projects':'certifications';
  const records=Array.from({length:kind==='work'?6:15},(_,i)=>({_id:`record${i}`,name:i===0?'Microsoft Technology Associate: Software Development Fundamentals':`Credential or project ${i+1}`,order:i,enabled:true,description:'Documented knowledge of software development, databases and professional tools, supported by the original credential.',images:[`/archive-${i}-0.svg`,`/archive-${i}-1.svg`],tags:[{name:'Microsoft'},{name:'Software development'}],pdf_links:['https://example.com/credential.pdf'],source_code_link2:'https://example.com'}));
  let releaseData, calls=0;
  const dataGate=new Promise(resolve=>releaseData=resolve);
  await page.route(`**/api/${endpoint}`,async r=>{calls++;await dataGate;await r.fulfill({json:[...records].reverse()});});
  const imageGates=new Map();
  await page.route('**/archive-*.svg',async r=>{await new Promise(resolve=>imageGates.set(new URL(r.request().url()).pathname,resolve));await r.fulfill({contentType:'image/svg+xml',body:svg});});
  await page.goto(`http://127.0.0.1:5173/#${kind}`);
  await page.locator('.archive-loading').waitFor();
  assert.equal(await page.locator('.project-index-item').count(),0,'No fallback items before live response');
  releaseData();
  await page.locator('.project-index-item').first().waitFor();
  assert.equal(await page.locator('.project-index-item.selected strong').textContent(),records[0].name);
  const preview=page.locator('.project-window img');
  await preview.waitFor({state:'attached'});
  assert.equal(await preview.getAttribute('src'),'/archive-0-0.svg');
  assert.equal(await preview.evaluate(e=>getComputedStyle(e).opacity),'0');
  while(!imageGates.has('/archive-0-0.svg')) await new Promise(r=>setTimeout(r,10));
  imageGates.get('/archive-0-0.svg')();
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('.project-window img')).opacity==='1');
  const oldImage=await preview.elementHandle();
  await page.locator('.project-index-item').nth(1).click();
  assert.equal(await oldImage.evaluate(e=>e.isConnected),false,'Old bitmap element is removed immediately');
  assert.equal(await preview.getAttribute('src'),'/archive-1-0.svg');
  assert.equal(await preview.evaluate(e=>getComputedStyle(e).opacity),'0');
  while(!imageGates.has('/archive-1-0.svg')) await new Promise(r=>setTimeout(r,10));
  imageGates.get('/archive-1-0.svg')();
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('.project-window img')).opacity==='1');
  await page.getByRole('button',{name:kind==='work'?'Next screenshot':'Next credential page',exact:true}).click();
  assert.equal(await preview.getAttribute('src'),'/archive-1-1.svg');
  await page.locator('.project-index-item').first().click();
  assert.equal(await preview.getAttribute('src'),'/archive-0-0.svg','Changing records resets to first image synchronously');
  for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[1024,700]]) {
   await page.setViewportSize({width,height}); await page.evaluate(()=>document.fonts.ready);
   const metrics=await page.evaluate(()=>({height:document.documentElement.scrollHeight,actions:document.querySelector('.project-actions').getBoundingClientRect().bottom,dock:document.querySelector('.interface-bottom').getBoundingClientRect().top,overflow:document.querySelector('.project-description').scrollHeight-document.querySelector('.project-description').clientHeight}));
   assert.ok(metrics.height<=height+1,`${kind} ${width}: document overflow ${JSON.stringify(metrics)}`);
   assert.ok(metrics.actions<=metrics.dock+1,`${kind} ${width}: hidden actions`);
   assert.ok(metrics.overflow<=1,`${kind} ${width}: details overflow ${metrics.overflow}`);
   if(kind==='certifications'&&width===1366) await page.screenshot({path:'docs/design/certifications-matching-work.png'});
  }
  await page.evaluate(()=>location.hash='overview');
  await page.locator('.archive-panel').waitFor({state:'detached'});
  await page.evaluate(k=>location.hash=k,kind);
  await page.locator('.project-index-item').first().waitFor();
  assert.equal(await page.locator('.project-index-item.selected strong').textContent(),records[0].name);
  assert.equal(await preview.getAttribute('src'),'/archive-0-0.svg');
  assert.equal(calls,1,'Reopening uses fresh cached archive');
  assert.deepEqual(errors,[]);
  console.log(`PASS ${kind}: delayed data, sorted first selection, delayed previews, synchronous page reset, cached reopen and four desktop sizes`);
  await page.close();
 }
} finally {await browser.close();}
