// Exercise section controls, population scopes and evidence links in both summaries.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(fs.readFileSync(path.join(root,'lab-research.json'),'utf8'));
const nodes=new Map(['#main','#nav','#status'].map(key=>[key,{innerHTML:'',textContent:'',scrollTop:0}]));
const location={search:'',href:''};
const context=vm.createContext({URL,URLSearchParams,console,DATA:data,location,
 history:{replaceState(_s,_t,url){location.search=url},pushState(){}},
 document:{addEventListener(){},querySelector:key=>nodes.get(key)??null,body:{classList:{remove(){}},dataset:{}}},
 window:{addEventListener(){}},fetch:()=>new Promise(()=>{})});
for(const file of ['corl-summary.js','synthesis.js','labs.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
vm.runInContext('report=DATA;',context);
const render=query=>{location.search=query;vm.runInContext('render()',context);return nodes.get('#main').innerHTML};
const queries=html=>[...html.matchAll(/href="(\?[^\"]+)"/g)].map(match=>new URLSearchParams(match[1].slice(1).replaceAll('&amp;','&')));
const all=vm.runInContext('synthesisRows()',context);
const examples=vm.runInContext('Object.values(SYNTHESIS_EXAMPLES).flat()',context);
assert(examples.every(([id])=>all.some(row=>row.p.id===id)), 'Every curated example must resolve');

// Arrange / Act / Assert: each population and section renders the requested scope.
let checkedLinks=0;
for(const population of ['all','labs','companies']){
 const expected=all.filter(row=>population==='all'||(population==='companies'?row.p.company:!row.p.company));
 for(const section of ['overview','hardware','runtime','lifecycle','recording']){
  const html=render(`?view=synthesis&population=${population}&section=${section}`);
  assert(html.includes(`${expected.length} workflow records`));
  assert.equal((html.match(/class="cs-chapter"/g)??[]).length,section==='overview'?4:1);
  if(section!=='overview')assert(html.includes(`aria-labelledby="synthesis-${section}"`));
  assert(!/bar-track|evidence-bar|insight-cases|\p{Extended_Pictographic}/u.test(html));
  for(const query of queries(html)){
   if(query.has('project')){
    const row=expected.find(row=>row.p.id===query.get('project'));
    assert(row,`Out-of-scope example: ${query}`);
    const page=render('?'+query);
    assert.equal((page.match(/class="workflow-evidence"/g)??[]).length,1);
    checkedLinks++;
   }
   if(query.get('view')==='synthesis'){
    if(query.get('population')===population)assert(query.has('section'));
    else assert.equal(query.get('section'),section);
   }
  }
 }
 // Act / Assert: evidence-index links produce matching table populations and counts.
 const html=render(`?view=synthesis&population=${population}`);
 for(const query of queries(html).filter(query=>query.has('labels'))){
  assert.equal(query.get('kind'),population);
  const label=data.practiceLabels.find(label=>label.id===query.get('labels'));
  const count=expected.filter(row=>label.members.some(member=>member.id===row.p.id)).length;
  assert.equal((render('?'+query).match(/class="workflow-evidence"/g)??[]).length,count);
 }
}

// Act / Assert: CoRL uses the same segmented controls and displays no chapter numbers.
for(const section of ['overview','compute','software','communication','timing','operations','data']){
 const html=render(`?view=corl-summary&section=${section}`);
 assert(html.includes('class="dimension-tabs cs-controls"'));
 assert(!/cs-index|<span>0[1-9]<\/span>|cs-chapter-nav/.test(html));
 assert.equal((html.match(/class="cs-chapter"/g)??[]).length,section==='overview'?6:1);
 if(section!=='overview')assert(html.includes(`id="summary-${section}"`));
 assert(queries(html).some(query=>query.get('section')==='overview'));
}
assert.equal((render('?view=synthesis&population=invalid&section=invalid').match(/class="cs-chapter"/g)??[]).length,4);
assert.equal((render('?view=corl-summary&section=invalid').match(/class="cs-chapter"/g)??[]).length,6);
const css=fs.readFileSync(path.join(root,'corl-summary.css'),'utf8');
assert(css.includes('--cs-accent:#0969da;'));
assert(!/#186c73|#aac6c8|#aec8cb|#789a9e/.test(css));
console.log(`Synthesis passed: all 3 populations, 5 sections, ${checkedLinks} scoped example links, evidence-index counts, blue theme and unnumbered CoRL controls.`);
