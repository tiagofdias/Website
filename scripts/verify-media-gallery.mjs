import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {adminMocks} from './admin-fixture.mjs';
import {projectVideo} from '../src/utils/projectVideo.js';
const drive='https://drive.google.com/file/d/public-video-12345/view?usp=sharing';
assert.equal(projectVideo(drive).src,'/api/media/drive-video/public-video-12345');
assert.equal(projectVideo(drive).preview,'https://drive.google.com/file/d/public-video-12345/preview');
assert.equal(projectVideo('/demo.webm').type,'file');
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 for(const width of [390,1366,1847]){
  const page=await browser.newPage({viewport:{width,height:945}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const images=['/gallery-1.svg','/gallery-2.svg','/gallery-3.svg'];
  await page.route('**/api/**',r=>r.fulfill({status:503,body:'offline'}));
  await page.route('**/api/projects',r=>r.fulfill({json:[{_id:'p1',name:'Gallery project',description:'A readable interface and demo.',enabled:true,images,demo_video_url:drive,tags:[]}]}));
  await page.route('**/gallery-*.svg',r=>r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><rect width="1920" height="1080" fill="#123347"/><text x="600" y="550" fill="white" font-size="48">Readable project interface</text></svg>'}));
  await page.route('https://drive.google.com/file/d/**/preview',r=>r.fulfill({contentType:'text/html',body:'<button>Play demo</button>'}));
  await page.goto('http://127.0.0.1:5173/#work');
  await page.locator('.project-video-embed').waitFor();assert.match(await page.locator('.project-video-embed').getAttribute('src'),/\/preview$/);assert.equal(await page.locator('.video-failure').count(),0);
  await page.getByRole('button',{name:'Open project media gallery',exact:true}).click();
  const viewer=page.locator('.media-viewer[open]');await viewer.waitFor();assert.equal(await viewer.locator('.media-viewer-thumbnails button').count(),4);
  await viewer.getByRole('button',{name:'View screenshot 2',exact:true}).click();assert.equal(await viewer.locator('.media-viewer-canvas img').getAttribute('src'),images[1]);
  assert.equal(await viewer.locator('.media-viewer-canvas').evaluate(e=>e.style.width),'100%','Screenshot defaults to Fit');
  await viewer.getByRole('button',{name:'Zoom in',exact:true}).click();await viewer.getByRole('button',{name:'Zoom in',exact:true}).click();
  const zoom=await viewer.locator('.media-viewer-viewport').evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth}));assert.ok(zoom.scroll>=zoom.width*1.9,'Zoomed image can be panned');
  await viewer.getByRole('button',{name:'Fit',exact:true}).click();await viewer.getByRole('button',{name:'Next media',exact:true}).click();assert.equal(await viewer.locator('.media-viewer-canvas img').getAttribute('src'),images[2]);
  await page.keyboard.press('ArrowLeft');assert.equal(await viewer.locator('.media-viewer-canvas').evaluate(e=>e.style.width),'100%','Switching images resets Fit');assert.equal(await viewer.locator('.media-viewer-canvas img').getAttribute('src'),images[1]);
  await viewer.getByRole('button',{name:'View demo video',exact:true}).click();await viewer.locator('iframe').waitFor();await viewer.getByRole('button',{name:'View screenshot 1',exact:true}).click();
  await viewer.getByRole('button',{name:'Actual size',exact:true}).click();
  await page.screenshot({path:`docs/design/media-gallery-${width}.png`});
  const bounds=await viewer.boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=width+1);assert.ok(bounds.y>=0&&bounds.y+bounds.height<=946);
  await page.keyboard.press('Escape');assert.equal(await page.locator('.media-viewer').count(),0);assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden');assert.deepEqual(errors,[]);await page.close();
  const admin=await browser.newPage({viewport:{width,height:945}});const state=await adminMocks(admin);state.projects[0].demo_video_url=drive;
  await admin.route('https://drive.google.com/file/d/**/preview',r=>r.fulfill({contentType:'text/html',body:'<button>Play demo</button>'}));
  await admin.goto('http://127.0.0.1:5173/admin');await admin.getByRole('button',{name:'Edit Sonar',exact:true}).click();await admin.getByRole('button',{name:'Preview screenshot 1',exact:true}).click();
  await admin.getByRole('button',{name:'View demo video',exact:true}).click();await admin.locator('.media-viewer iframe').waitFor();await admin.getByRole('button',{name:'View screenshot 1',exact:true}).click();await admin.keyboard.press('Escape');await admin.locator('.cms-editor[open]').waitFor();assert.equal(state.writes.filter(w=>["PUT","DELETE","PATCH"].includes(w.method)).length,0);await admin.close();
  console.log(`PASS ${width}px: public/admin gallery navigation, all screenshots and Drive video, zoom/pan, keyboard, Escape, viewport fit and no content writes`);
 }
}finally{await browser.close()}
