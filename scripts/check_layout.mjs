// Browser regression checks for SVG sizing and responsive layouts on both summary pages.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {pathToFileURL} from 'node:url';

const {values}=parseArgs({options:{
 playwright:{type:'string'}, browser:{type:'string'}, url:{type:'string'}, screenshots:{type:'string'},
}});
assert(values.playwright&&values.browser&&values.url,'Pass --playwright /path/to/index.mjs --browser /path/to/chromium --url http://localhost:8080/');
const {chromium}=await import(pathToFileURL(path.resolve(values.playwright)).href);
const VIEWPORT_WIDTHS=[390,750,751,1024,1440];
const VIEWPORT_HEIGHT=1000;
const GLYPH_SIZE=15, ARROW_SIZE=11, MOBILE_BREAKPOINT=750, PIXEL_TOLERANCE=0.5;
const browser=await chromium.launch({headless:true,executablePath:values.browser});
if(values.screenshots)await mkdir(values.screenshots,{recursive:true});
let pages=0;
try{
 for(const view of ['corl-summary','synthesis'])for(const width of VIEWPORT_WIDTHS){
  // Arrange: load the actual CSS and JavaScript at each side of the mobile breakpoint.
  const page=await browser.newPage({viewport:{width,height:VIEWPORT_HEIGHT}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const url=new URL(values.url);url.search=new URLSearchParams({view}).toString();
  await page.goto(url.href);
  await page.locator('.corl-summary').waitFor();
  // Act: inspect the computed layout, including rules following the mobile media block.
  const layout=await page.evaluate(()=>{
   const measure=element=>{const bounds=element.getBoundingClientRect(),style=getComputedStyle(element);return {width:bounds.width,height:bounds.height,fill:style.fill,stroke:style.stroke}};
   return {icons:[...document.querySelectorAll('.cs-controls .cs-glyph')].map(measure),
    arrows:[...document.querySelectorAll('.cs-link-arrow')].map(measure),
    chapterDisplay:getComputedStyle(document.querySelector('.cs-chapter')).display,
    controlsDisplay:getComputedStyle(document.querySelector('.cs-controls .button')).display,
    exampleColor:document.querySelector('.sy-examples h3 a')?getComputedStyle(document.querySelector('.sy-examples h3 a')).color:null,
    viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,
    mainWidth:document.querySelector('main').clientWidth,mainScroll:document.querySelector('main').scrollWidth};
  });
  // Assert: desktop icons stay small/unfilled, mobile content stacks, and pages don't overflow.
  assert(layout.icons.length>0);
  for(const icon of layout.icons){
   assert(Math.abs(icon.width-GLYPH_SIZE)<=PIXEL_TOLERANCE,`${view} ${width}: glyph width ${icon.width}`);
   assert(Math.abs(icon.height-GLYPH_SIZE)<=PIXEL_TOLERANCE);
   assert.equal(icon.fill,'none');
  }
  for(const arrow of layout.arrows){
   assert(Math.abs(arrow.width-ARROW_SIZE)<=PIXEL_TOLERANCE,`${view} ${width}: arrow width ${arrow.width}`);
   assert(Math.abs(arrow.height-ARROW_SIZE)<=PIXEL_TOLERANCE);
   assert.equal(arrow.fill,'none');
  }
  assert.equal(layout.chapterDisplay,width<=MOBILE_BREAKPOINT?'block':'grid');
  assert(['flex','inline-flex'].includes(layout.controlsDisplay));
  if(view==='synthesis')assert.equal(layout.exampleColor,'rgb(9, 105, 218)');
  assert(layout.documentWidth<=layout.viewport,`${view} ${width}: document overflow`);
  assert(layout.mainScroll<=layout.mainWidth,`${view} ${width}: main overflow`);
  if(values.screenshots)await page.screenshot({path:path.join(values.screenshots,`${view}-${width}.png`)});
  const topic=view==='corl-summary'?'Timing':'Recording';
  await page.locator('.cs-controls a').filter({hasText:topic}).click();
  await page.locator('.cs-chapter').waitFor();
  assert.equal(await page.locator('.cs-chapter').count(),1);
  if(values.screenshots)await page.screenshot({path:path.join(values.screenshots,`${view}-${width}-section.png`)});
  assert.deepEqual(errors,[]);
  await page.close();pages++;
 }
 console.log(`Browser layout passed: ${pages} page/viewport combinations, glyphs, arrows, stacking, overflow and section navigation.`);
}finally{await browser.close()}
