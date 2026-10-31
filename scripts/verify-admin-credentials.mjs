import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {adminMocks} from './admin-fixture.mjs';
const token=(username,version)=>`${Buffer.from(JSON.stringify({alg:'HS256'})).toString('base64url')}.${Buffer.from(JSON.stringify({username,credentialVersion:version,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.test-only`;
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:950}});await adminMocks(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const state={username:'test-owner',password:'Original test password',version:0,saves:[],fail:false};
  await page.route('**/api/admin/account',async route=>{
   if(route.request().method()==='GET')return route.fulfill({json:{username:state.username,credentialVersion:state.version}});
   const body=route.request().postDataJSON();state.saves.push(body);
   if(state.fail){state.fail=false;return route.fulfill({status:503,json:{error:'Temporary account save failure'}})}
   if(body.currentPassword!==state.password)return route.fulfill({status:403,json:{error:'Current password is incorrect.'}});
   state.username=body.username;if(body.newPassword)state.password=body.newPassword;state.version++;
   return route.fulfill({json:{username:state.username,token:token(state.username,state.version)}});
  });
  await page.route('**/api/login',route=>{const input=route.request().postDataJSON();return input.username===state.username&&input.password===state.password?route.fulfill({json:{token:token(state.username,state.version)}}):route.fulfill({status:401,json:{error:'Invalid credentials'}})});
  await page.goto('http://127.0.0.1:5173/admin?section=settings');await page.getByLabel('Admin username',{exact:true}).waitFor();assert.equal(await page.getByLabel('Admin username',{exact:true}).inputValue(),'test-owner');
  await page.getByLabel('Admin username',{exact:true}).fill('updated-owner');await page.getByLabel('Current password',{exact:true}).fill('wrong');await page.getByRole('button',{name:'Save sign-in details',exact:true}).click();await page.getByText('Current password is incorrect.',{exact:true}).waitFor();assert.equal(await page.locator('.cms-login').count(),0,'Wrong current password does not log the user out');
  await page.getByLabel('Current password',{exact:true}).fill(state.password);await page.getByLabel('New password',{exact:true}).fill('Updated test passphrase');await page.getByLabel('Confirm new password',{exact:true}).fill('Mismatched passphrase');const before=state.saves.length;await page.getByRole('button',{name:'Save sign-in details',exact:true}).click();await page.getByText('The new passwords do not match.',{exact:true}).waitFor();assert.equal(state.saves.length,before);
  await page.getByLabel('Confirm new password',{exact:true}).fill('Updated test passphrase');state.fail=true;await page.getByRole('button',{name:'Save sign-in details',exact:true}).click();await page.getByText('Temporary account save failure',{exact:true}).waitFor();assert.equal(await page.getByLabel('New password',{exact:true}).inputValue(),'Updated test passphrase');assert.equal(state.username,'test-owner');
  await page.getByRole('button',{name:'Save sign-in details',exact:true}).click();await page.getByText('Sign-in details updated. Other sessions have been signed out.',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('token')),token('updated-owner',1));
  for(const label of ['Current password','New password','Confirm new password'])assert.equal(await page.getByLabel(label,{exact:true}).inputValue(),'');
  await page.screenshot({path:`docs/design/admin-credentials-${width}.png`});
  await page.reload();await page.getByLabel('Admin username',{exact:true}).waitFor();assert.equal(await page.getByLabel('Admin username',{exact:true}).inputValue(),'updated-owner');
  await page.getByLabel('Admin username',{exact:true}).fill('renamed-owner');await page.getByLabel('Current password',{exact:true}).fill(state.password);await page.getByRole('button',{name:'Save sign-in details',exact:true}).click();await page.getByText('Sign-in details updated. Other sessions have been signed out.',{exact:true}).waitFor();assert.equal(state.password,'Updated test passphrase');
  if(width<900)await page.getByRole('button',{name:'Open admin navigation',exact:true}).click();await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByLabel('Username',{exact:true}).fill('renamed-owner');await page.getByLabel('Password',{exact:true}).fill('Updated test passphrase');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('.cms-app').waitFor();assert.deepEqual(errors,[]);
  console.log(`PASS ${width}px: current-password rejection, confirmation, failed-save preservation, credential update, renewed token, reload, username-only update and sign-in with new credentials; mock writes only`);await page.close();
 }
}finally{await browser.close()}
