// Check published HTML, canonical routes and enhancement in a real browser.
import assert from 'node:assert/strict';
import {parseArgs} from 'node:util';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const {values}=parseArgs({options:{playwright:{type:'string'},browser:{type:'string'},url:{type:'string'}}});
assert(values.playwright&&values.browser&&values.url,'Pass --playwright, --browser and --url');
const {chromium}=await import(pathToFileURL(path.resolve(values.playwright)).href);
const browser=await chromium.launch({headless:true,executablePath:values.browser});
const PUBLIC_URL='https://cutuy.github.io/robotics-systems-survey/';
const PAGES=[['','practices','Current practices'],['corl-summary.html','corl-summary','Inside the robot.'],['synthesis.html','synthesis','What connects a robot run.'],['sources.html','sources','Sources behind the current survey']];
try{
 // Arrange: disable JavaScript to exercise the actual generated HTML.
 const staticContext=await browser.newContext({javaScriptEnabled:false});
 const titles=new Set();
 for(const [file,view,heading] of PAGES){
  const page=await staticContext.newPage();
  const response=await page.goto(new URL(file,values.url).href);
  // Assert: useful content, navigation and metadata exist without rendering JavaScript.
  assert.equal(response.status(),200);
  assert.equal(await page.locator('h1').count(),1);
  assert((await page.locator('h1').textContent()).includes(heading));
  assert((await page.locator('main').innerText()).length>1000);
  assert.equal(await page.locator('nav a').count(),PAGES.length);
  assert.equal(await page.locator('link[rel=canonical]').count(),1);
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),PUBLIC_URL+file);
  assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'),PUBLIC_URL+file);
  const schema=JSON.parse(await page.locator('#page-schema').textContent());
  assert.equal(schema.url,PUBLIC_URL+file);
  titles.add(await page.title());
  if(view==='practices')assert(await page.locator('tbody tr').count()>500);
  await page.close();
 }
 assert.equal(titles.size,PAGES.length);
 const sitemap=await staticContext.request.get(new URL('sitemap.xml',values.url).href);
 assert.equal(sitemap.status(),200);
 const locations=[...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
 assert.deepEqual(locations,PAGES.map(([file])=>PUBLIC_URL+file));
 await staticContext.close();
 // Act: visit legacy URLs and exercise cross-view links, filters and browser history.
 const page=await browser.newPage();
 const errors:string[]=[];page.on('pageerror',(error:Error)=>errors.push(error.message));
 for(const [file,view] of PAGES){
  await page.goto(new URL('?view='+view,values.url).href);
  await page.waitForFunction(()=>typeof report!=='undefined'&&Boolean(report));
  assert.equal(new URL(page.url()).pathname,new URL(file,values.url).pathname);
  assert.equal(await page.locator('body').getAttribute('data-view'),view);
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),PUBLIC_URL+file);
 }
 await page.goto(new URL('corl-summary.html',values.url).href);
 await page.waitForFunction(()=>typeof report!=='undefined'&&Boolean(report));
 await page.locator('.cs-open-table').click();
 assert.equal(await page.locator('body').getAttribute('data-view'),'practices');
 assert.equal(new URL(page.url()).searchParams.get('cohort'),'corl-2026-full-scan');
 const before=await page.locator('tbody tr').count();
 await page.locator('input[name=q]').fill('AsyncVLA');
 assert(await page.locator('tbody tr').count()<before);
 assert((await page.locator('tbody').textContent()).includes('AsyncVLA'));
 await page.goBack();
 await page.waitForSelector('.corl-summary');
 assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),PUBLIC_URL+'corl-summary.html');
 await page.goto(new URL('labs.html?view=corl-summary&section=timing',values.url).href);
 await page.waitForSelector('#summary-timing');
 await page.waitForFunction(()=>typeof report!=='undefined'&&Boolean(report));
 assert.equal(await page.locator('.cs-chapter').count(),1);
 // Act: type into the static form while the data response is still pending.
 let releaseData!:()=>void;
 const dataGate=new Promise<void>(resolve=>{releaseData=resolve});
 await page.route('**/lab-research.json',async route=>{await dataGate;await route.continue()});
 await page.goto(values.url,{waitUntil:'domcontentloaded'});
 await page.locator('input[name=q]').fill('AsyncVLA');
 releaseData();
 await page.waitForFunction(()=>typeof report!=='undefined'&&Boolean(report));
 assert((await page.locator('tbody').textContent()).includes('AsyncVLA'));
 assert(await page.locator('tbody tr').count()<before);
 await page.unroute('**/lab-research.json');
 // Assert: the static snapshot survives a failed data request.
 await page.route('**/lab-research.json',route=>route.abort());
 await page.goto(values.url);
 await page.waitForFunction(()=>document.querySelector('#status')?.textContent?.includes('Interactive filters unavailable'));
 assert(await page.locator('tbody tr').count()>500);
 assert.deepEqual(errors,[]);
 console.log('SEO passed: 4 useful pages without JavaScript, unique metadata, sitemap, legacy routes, filters, browser history and data failure fallback.');
}finally{await browser.close()}
