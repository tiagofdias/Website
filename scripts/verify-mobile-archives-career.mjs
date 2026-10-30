import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',r=>r.fulfill({status:503,body:'offline'}));
 for(const width of [320,390,600,820,960]){
  await page.setViewportSize({width,height:844});
  for(const [view,label] of [['work','project'],['certifications','certification']]){
   await page.goto(`http://127.0.0.1:5173/#${view}`);
   const trigger=page.getByRole('button',{name:`Choose ${label}`,exact:true});await trigger.waitFor();
   assert.equal(await page.locator('.archive-index').isVisible(),false);
   const first=await page.locator('.mobile-picker-trigger strong').textContent();
   await page.getByRole('button',{name:`Next ${label}`,exact:true}).click();assert.notEqual(await page.locator('.mobile-picker-trigger strong').textContent(),first);
   await page.getByRole('button',{name:`Previous ${label}`,exact:true}).click();assert.equal(await page.locator('.mobile-picker-trigger strong').textContent(),first);
   await trigger.click();await page.locator('.mobile-picker-sheet[open]').waitFor();
   assert.equal(await page.locator('.mobile-picker-options>button').count(),6);
   const search=page.locator('.mobile-picker-search input');await search.fill('zz-no-such-record');await page.locator('.mobile-picker-empty').waitFor();
   await page.getByRole('button',{name:'Clear search',exact:true}).click();
   const third=await page.locator('.mobile-picker-options>button strong').nth(2).textContent();
   await search.fill(third);assert.ok((await page.locator('.mobile-picker-options>button').count())>=1);
   await page.locator('.mobile-picker-options>button').first().click();await page.locator('.mobile-picker-sheet').waitFor({state:'detached'});
   assert.equal(await page.locator('.mobile-picker-trigger strong').textContent(),third);assert.equal(await page.locator('.project-description h2').textContent(),third);
   assert.match(await page.locator('.gallery-controls').innerText(),/01/);
   await trigger.click();await page.keyboard.press('Escape');await page.locator('.mobile-picker-sheet').waitFor({state:'detached'});assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width} ${view} horizontal scroll`);
   if(width===390)await page.screenshot({path:`docs/design/mobile-${view}-selector.png`});
  }
  await page.goto('http://127.0.0.1:5173/#experience');await page.locator('.career-entry-toggle').first().waitFor();
  assert.equal(await page.locator('.career-callout h2').isVisible(),false);
  const metrics=await page.locator('.career-entry-toggle').first().evaluate(e=>{const date=e.children[0].getBoundingClientRect(),role=e.children[1].getBoundingClientRect(),strong=e.querySelector('strong');return {dateBottom:date.bottom,titleTop:role.top,titleWidth:role.width,font:parseFloat(getComputedStyle(strong).fontSize),cardWidth:e.clientWidth}});
  assert.ok(metrics.dateBottom<=metrics.titleTop+1);assert.ok(metrics.titleWidth>metrics.cardWidth*.65);assert.ok(metrics.font>=16);
  await page.locator('.career-entry-toggle').nth(1).click();assert.equal(await page.locator('.career-entry-toggle').nth(1).getAttribute('aria-expanded'),'true');assert.equal(await page.locator('.career-entry-toggle').first().getAttribute('aria-expanded'),'false');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(width===390){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'docs/design/mobile-career-cards.png'});}
  console.log(`PASS ${width}px: both selectors, searchable chooser, first-image reset, navigation, dismissal, role cards and no horizontal overflow`);
 }
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:5173/#work');await page.getByRole('button',{name:'Choose project',exact:true}).click();await page.setViewportSize({width:1024,height:844});await page.locator('.mobile-picker-sheet').waitFor({state:'detached'});assert.equal(await page.locator('.mobile-archive-picker').isVisible(),false);assert.equal(await page.locator('.archive-index').isVisible(),true);assert.deepEqual(errors,[]);
 console.log('PASS desktop restores original index and closes mobile chooser; no browser errors');
}finally{await browser.close()}
