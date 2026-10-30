import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try {
 for(const width of [390,1440]) {
  const page=await browser.newPage({viewport:{width,height:900}});let posts=0;
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/**',r=>r.fulfill({status:503,body:'offline'}));
  await page.route('**/api/chat',r=>{posts++;return r.fulfill({json:{source:'profile',unavailableReason:'provider_rate_limited',response:'Unrelated generic biography'}})});
  await page.goto('http://127.0.0.1:5173/');
  await page.getByRole('button',{name:'Open AI assistant',exact:true}).click();
  const send=async text=>{await page.locator('#ai-question').fill(text);await page.getByRole('button',{name:'Send question',exact:true}).click();};
  await send('how old is he');
  await page.locator('.ai-message.assistant').last().waitFor();
  assert.match(await page.locator('.ai-message.assistant').last().innerText(),/not documented/);assert.equal(posts,0);
  await send('Tell me about his experience.');
  await page.waitForFunction(()=>document.querySelectorAll('.ai-message.assistant').length===2);assert.equal(posts,0);
  await send('Explain the tradeoffs in Python RAG architecture');
  await page.waitForFunction(()=>document.querySelectorAll('.ai-message.assistant').length===3);
  const reference=await page.locator('.ai-message.assistant').last().innerText();
  assert.match(reference,/Profile reference/);assert.match(reference,/unavailable/);assert.doesNotMatch(reference,/Unrelated generic biography/);assert.equal(posts,1);
  await page.unroute('**/api/chat');await page.route('**/api/chat',r=>{posts++;return r.abort('failed')});
  await send('What is his favorite pizza?');
  await page.waitForFunction(()=>document.querySelectorAll('.ai-message.assistant').length===4);
  assert.match(await page.locator('.ai-message.assistant').last().innerText(),/couldn’t find a verified answer/);
  assert.deepEqual(errors,[]);console.log(`PASS ${width}px: age and typed experience need zero providers; rate limits and network outage show honest references without unrelated biography`);await page.close();
 }
} finally {await browser.close()}
