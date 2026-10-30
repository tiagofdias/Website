import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {adminMocks} from './admin-fixture.mjs';
import {imageSources} from '../src/utils/imageSources.js';
const id='public-image-12345',drive=`https://drive.google.com/file/d/${id}/view?usp=sharing`;
assert.equal(imageSources(drive)[0],`https://lh3.googleusercontent.com/d/${id}=w1600`);
assert.equal(imageSources(`https://drive.google.com/open?id=${id}`)[0],imageSources(drive)[0]);
assert.deepEqual(imageSources('https://example.com/file/d/public-image-12345'),['https://example.com/file/d/public-image-12345']);
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="650"><rect width="1000" height="650" fill="#20425b"/><text x="60" y="300" fill="white" font-size="64">Project screenshot</text></svg>';
try {
 for(const width of [390,1440]) {
  const page=await browser.newPage({viewport:{width,height:950}}),state=await adminMocks(page),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  state.projects[0].images=[drive,'/favicon.svg','https://example.com/missing.png'];
  await page.route('https://lh3.googleusercontent.com/**',r=>r.fulfill({status:403,body:'unavailable'}));
  await page.route('https://drive.google.com/thumbnail**',r=>r.fulfill({contentType:'image/svg+xml',body:svg}));
  await page.route('https://example.com/missing.png',r=>r.fulfill({status:404,body:'missing'}));
  await page.goto('http://127.0.0.1:5173/admin');await page.getByRole('button',{name:'Edit Sonar',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.cms-image-preview img')?.naturalWidth>0);
  assert.match(await page.locator('.cms-image-preview img').first().getAttribute('src'),/drive.google.com\/thumbnail/);
  assert.equal(await page.getByLabel('Screenshot 1 URL',{exact:true}).inputValue(),drive);
  await page.locator('.cms-image-preview').nth(2).getByText('Preview unavailable',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Preview screenshot 1',exact:true}).click();
  await page.locator('.media-viewer[open]').waitFor();
  await page.waitForFunction(()=>document.querySelector('.media-viewer-canvas img')?.naturalWidth>0);
  const rect=await page.locator('.media-viewer').boundingBox();assert.ok(rect.x>=0&&rect.x+rect.width<=width+1);
  await page.keyboard.press('Escape');assert.equal(await page.locator('.media-viewer').count(),0);
  await page.getByLabel('Screenshot 1 URL',{exact:true}).fill('/favicon.svg');
  await page.waitForFunction(()=>document.querySelector('.cms-image-preview img')?.getAttribute('src')==='/favicon.svg'&&document.querySelector('.cms-image-preview img')?.naturalWidth>0);
  await page.waitForFunction(()=>getComputedStyle(document.querySelector(".cms-image-preview img")).opacity==="1");
  await page.screenshot({path:`docs/design/admin-image-preview-${width}.png`});
  await page.getByRole('button',{name:'Save project',exact:true}).click();await page.locator('.cms-editor').waitFor({state:'detached'});
  assert.deepEqual(state.projects[0].images,['/favicon.svg','/favicon.svg','https://example.com/missing.png']);assert.deepEqual(errors,[]);
  console.log(`PASS ${width}px: Drive fallback, local images, failed placeholders, enlarged preview, Escape focus, live URL edits and unchanged save semantics`);await page.close();
 }
}finally{await browser.close()}
