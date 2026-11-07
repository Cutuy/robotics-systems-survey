// Check the summary's routes, evidence destinations and accessible infographic structure.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data=JSON.parse(fs.readFileSync(path.join(root,'lab-research.json'),'utf8'));
const nodes=new Map(['#main','#nav','#status'].map(key=>[key,{innerHTML:'',textContent:'',scrollTop:0}]));
const location={search:'?view=corl-summary',href:''};
const context=vm.createContext({URL,URLSearchParams,console,DATA:data,location,
 history:{replaceState(_state,_title,url){location.search=url},pushState(){}},
 document:{addEventListener(){},querySelector:key=>nodes.get(key)??null,body:{classList:{remove(){}},dataset:{}}},
 window:{addEventListener(){}},fetch:()=>new Promise(()=>{})});

// Arrange: use the same script order as both HTML entry points.
for(const file of ['site.js','corl-summary.js','synthesis.js','labs.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
vm.runInContext('report=DATA;',context);

// Act: enter the summary through the actual application router.
vm.runInContext('render()',context);
const html=nodes.get('#main').innerHTML;

// Assert: chapters, diagrams and every evidence destination exist.
assert.equal(context.document.body.dataset.view,'corl-summary');
assert(nodes.get('#nav').innerHTML.includes('aria-current="page" href="./corl-summary.html"'));
assert(html.includes('Explore 571 entries'));
assert(!/undefined|NaN/.test(html));
assert(!/\p{Extended_Pictographic}/u.test(html),'Summary must use drawn glyphs, not emoji');
assert(!/evidence-bar|bar-track/.test(html));
const chapters=['compute','software','communication','timing','operations','data'];
for(const chapter of chapters){
 assert(html.includes(`id="summary-${chapter}"`));
 assert(html.includes(`section=${chapter}`));
 assert(html.includes(`aria-labelledby="summary-${chapter}-title"`));
}
assert.equal((html.match(/class="cs-topology"/g)??[]).length,3);
assert.equal((html.match(/role="img" aria-label=/g)??[]).length,3);
const topics=['Onboard platforms','CPU','GPU','System RAM','GPU memory &amp; footprint','Placement &amp; scale'];
// HTML-authored titles may contain literal ampersands; compare decoded display content.
const display=html.replaceAll('&amp;','&');
for(const title of topics.map(title=>title.replaceAll('&amp;','&')))assert(display.includes(`<h3>${title}</h3>`));
for(const title of ['Operating systems','Languages','Inference runtimes','Resource management','Scheduling & isolation','Middleware','Network IPC','Local IPC','Serialization','Hardware links','Timing & concurrency','Action buffering','Freshness & overload','Process ownership','Readiness','Fault recovery','Shutdown & supervision','Recording formats','Persistence & integrity','Replay','Provenance'])assert(display.includes(`<h3>${title}</h3>`));
const links=[...html.matchAll(/href="(\?[^\"]+)"/g)].map(match=>new URLSearchParams(match[1].slice(1)));
const evidence=links.filter(query=>query.has('project'));
assert(evidence.length>0);
for(const query of evidence){
 const record=data.deepSurvey.projects.find(record=>record.id===query.get('project'));
 assert(record,query.toString());
 assert.equal(record.cohort,'corl-2026-full-scan');
 assert(['overview','hardware','runtime','lifecycle','recording'].includes(query.get('dimension')));
 location.search='?'+query;
 vm.runInContext('render()',context);
 assert.equal((nodes.get('#main').innerHTML.match(/class="workflow-evidence"/g)??[]).length,1);
}
assert(html.includes('Evidence scope & open questions'));
assert(html.includes('LeRobot reference'));
assert(html.includes('Training scope'));
for(const entry of ['index.html','labs.html']){
 const page=fs.readFileSync(path.join(root,entry),'utf8');
 assert(page.indexOf('corl-summary.js')<page.indexOf('labs.js'));
 for(const asset of ['corl-summary.js','corl-summary.css'])assert(page.includes(asset+'?v='));
}
console.log(`Summary passed: ${chapters.length} chapters, 27 mechanism topics, 3 topology diagrams, ${evidence.length} working evidence links.`);
