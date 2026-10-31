import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {adminMocks} from './admin-fixture.mjs';
const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 const page=await b.newPage(),requests=[],errors=[];page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',r=>r.fulfill({status:503,body:'offline'}));
 for(const width of [390,1366,1920]){
  await page.setViewportSize({width,height:900});
  for(const view of ['home','work','certifications','experience','about','contact']){
   await page.goto(`http://127.0.0.1:5173/#${view}`);await page.locator('h1').waitFor();
   assert.equal(await page.locator('.ai-console,.command-strip,.project-ai-button,.role-fit-link').count(),0);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   const dock=await page.locator('.interface-bottom').boundingBox();assert.ok(dock.height<=100,'Navigation has no reserved chat-bar space');
  }
  await page.goto('http://127.0.0.1:5173/');await page.getByRole('button',{name:/Explore selected work/}).click();await page.locator('.work-panel').waitFor();
  await page.keyboard.press('Control+k');assert.equal(await page.locator('.ai-console').count(),0);
  console.log(`PASS ${width}px: public sections, direct Work action, no assistant UI or empty chat bar`);
 }
 assert.equal(requests.filter(url=>/\/api\/chat|openrouter\.ai/.test(url)).length,0,'No saved-answer or provider requests');
 const admin=await b.newPage();await adminMocks(admin);const adminRequests=[];admin.on('request',r=>adminRequests.push(r.url()));
 await admin.goto('http://127.0.0.1:5173/admin?section=statistics');await admin.getByText('Traffic over time',{exact:true}).waitFor();assert.equal(await admin.locator('.cms-conversations').count(),0);
 await admin.goto('http://127.0.0.1:5173/admin?section=settings');await admin.getByRole('heading',{name:'Account security',exact:true}).waitFor();assert.equal(await admin.getByText('AI configuration',{exact:true}).count(),0);
 assert.equal(adminRequests.filter(url=>/OPENROUTER|\/api\/statistics/.test(url)).length,0);assert.deepEqual(errors,[]);
 console.log('PASS no AI network requests; admin visitor analytics and security remain available without AI settings/logs');
}finally{await b.close()}
