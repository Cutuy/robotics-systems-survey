'use strict';
let report;const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(url,text)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`;
const refs=ids=>`<span class="refs">${ids.map(id=>{let i=report.sources.findIndex(s=>s.id===id),s=report.sources[i];return s?`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" title="${esc(s.title)}" aria-label="Source ${i+1}: ${esc(s.title)}">${i+1}</a>`:''}).join('')}</span>`;
const tag=(s,c='')=>`<span class="tag ${c}">${esc(s)}</span>`;
const local=(view,text,project)=>`<a href="?view=${view}${project?'&project='+project:''}">${text}</a>`;
function projects(id){let p=report.profiles.find(x=>x.id===id)||report.profiles[0];return `<div class="layout"><aside class="projects" aria-label="Projects">${report.profiles.map(x=>`<a href="?view=projects&project=${x.id}" class="${x.id===p.id?'active':''}"><strong>${esc(x.name)}</strong><small>${x.year} · ${esc(x.group)} · ${x.audit==='Code inspected'?'code reviewed':'paper review'}</small></a>`).join('')}</aside><article><div class="project-top"><div><p class="eyebrow">${esc(p.selection)}</p><h2>${esc(p.name)}</h2><p class="muted">${esc(p.headline)}</p><span class="small muted">${esc(p.org)} · ${esc(p.people)}</span></div><div class="contact">${refs([p.paper])} ${p.repo?link(p.repo,'Repository ↗'):''}</div></div><div class="hardware"><div><span class="label">▣ HARDWARE</span><strong>${esc(p.hardware)}</strong></div><div><span class="label">◷ HORIZON</span><strong>${esc(p.horizon)}</strong></div></div><div>${p.stack.map(s=>tag(s,'blue')).join('')}</div><p class="small"><a href="?view=systems&project=${p.id}&dimension=hardware">CPU / GPU / memory</a> · <a href="?view=systems&project=${p.id}&dimension=runtime">Resource controls / IPC</a> · <a href="?view=systems&project=${p.id}&dimension=lifecycle">Lifecycle</a> · <a href="?view=systems&project=${p.id}&dimension=recording">Recording implementation ↗</a></p><table class="fact-table"><tbody>${p.facts.map(f=>`<tr><td>${esc(f.label)}</td><td>${esc(f.value)} ${refs(f.sources)}</td></tr>`).join('')}</tbody></table><div class="proof"><strong>⌘ ${p.audit==='Code inspected'?'Source inspection':'Published evidence'}</strong> ${refs(p.evidenceRefs)}<p>${esc(p.evidence)}</p></div><div class="two"><section><p class="eyebrow">PROPOSED RESEARCH CONTRIBUTION</p><h3>${esc(p.seam)}</h3><p class="small">${esc(p.offer)}</p><p class="label">HOW TO TEST IT</p><p class="small">${esc(p.test)}</p></section><section class="card"><p class="label">ADOPTION ASSESSMENT</p><p>${esc(p.adoption)}</p></section></div><div class="method"><div><strong>Inspection limits</strong><p>${esc(p.limits)}</p></div><div><strong>Evidence & proposed functionality</strong><p>The setup and code findings are sourced above. The contribution and test are product hypotheses for discussion with the authors.</p></div></div></article></div>`}
function researchMetrics(){const rows=surveyRows().filter(r=>!r.p.deploymentClass||r.p.deploymentClass==='physical deployment');return `<section class="research-metrics"><p>Documented in ${rows.length} reviewed physical workflows</p><div>${['orin','ram16','mcap','hdf5','episode-save','rt'].map(id=>{const l=report.practiceLabels?.find(x=>x.id===id);if(!l)return '';const n=rows.filter(r=>labelMember(l,r.p.id,'documented')).length;return `<a href="?view=practices&dimension=${l.dimension}&labels=${id}"><strong>${n}</strong><span>${esc(l.name)}</span></a>`}).join('')}</div></section>`}
function sourcesView(){return `<p class="eyebrow">AUDIT TRAIL</p><h2>Sources behind the current survey</h2><p>${surveyRows().length} workflow records · ${report.sources.length} source entries</p><ol class="sources">${report.sources.map(s=>`<li>${link(s.url,s.title)}${s.sha256?`<div class="small muted">Cached · SHA-256 ${esc(s.sha256.slice(0,16))}…</div>`:''}</li>`).join('')}</ol>`}
function deepCell(p,key){
 if(!p[key])return {value:'Not reviewed',status:'Not reviewed',sources:[]};
 if(/^(unknown|unreported|unspecified)\.?$/i.test(p[key].trim()))return {value:'Unreported',status:'Unknown',sources:[]};
 const value=p[key];
 const status=!p[key]||/^(unknown|unreported|unspecified|not (published|specified|reported|documented|established|publicly)|public implementation evidence)/i.test(value)?'Open question':/inferen|candidate|likely|hypothes|plausib/i.test(value)?'Evidence + inference':/not published|unverified|unknown|unreported|unspecified|unpublished|unresolved|requires.*(inspection|verification)|TODO/i.test(value)?'Evidence + open questions':'Source reviewed';
 return {value,status,sources:p.fieldRefs?.[key]?.length?p.fieldRefs[key]:p.sourceIds};
}
function surveyRows(){
 const existing=report.systems.primaryProjects.map(id=>{
  const p=report.profiles.find(p=>p.id===id),sys=report.systems.projects[id],lab=report.census.labs.find(l=>l.projects?.includes(id));
  return {p,sys,lab,name:lab?.name||p.org,country:lab?.country||'',search:[p.name,p.org,p.hardware,...Object.values(sys).flat().map(c=>c.value)].join(' ').toLowerCase()};
 });
 const fresh=(report.deepSurvey?.projects||[]).map(p=>{
 const c=k=>deepCell(p,k),sys={hardware:[c('compute'),c('cpu'),c('gpu'),c('memory'),c('limitations')],runtime:[c('software'),c('software'),c('resources'),c('ipc'),deepCell({...p,timing:p.timing||p.horizon},'timing')],lifecycle:[c('lifecycle'),c('recovery'),c('readiness'),deepCell({...p,placement:p.placement||p.compute},'placement'),c('limitations')],recording:[c('recording'),c('buffering'),c('replay'),c('provenance'),c('limitations')]};
 return {p:{...p,deep:true,audit:'Deployment source review',horizon:p.horizon||''},sys,name:p.labName,country:p.country,search:[p.name,p.org,...Object.values(sys).flat().map(c=>c.value)].join(' ').toLowerCase()};
 });
 // Keep a single entry when the same lab/project repository is investigated again.
 const canon=u=>{try{const x=new URL(u);if(/^(raw\.githubusercontent\.com|github\.com)$/.test(x.hostname))return x.pathname.split('/').slice(1,3).join('/').toLowerCase().replace(/\.git$/,'');return u.toLowerCase().replace(/\/$/,'')}catch{return ''}};
 return [...(report.companySurvey?.rows||[]),...fresh,...existing.filter(r=>!fresh.some(n=>canon(n.p.repo)&&canon(n.p.repo)===canon(r.p.repo)&&(!n.p.deploymentClass||n.p.deploymentClass==='physical deployment')))];
}
function deepProject(id){
 const p=report.deepSurvey?.projects.find(p=>p.id===id);if(!p)return '<p>Deployment record unavailable.</p>';
 const labels={compute:'▣ Compute & placement',software:'⚙ OS & execution',resources:'Resource policy',ipc:'IPC & timing',lifecycle:'↻ Process lifecycle',recording:'◉ Recording & format',provenance:'Session provenance',limitations:'Inspection limits'};
 return `<div class="section-head"><div><p class="eyebrow">${esc(p.labName)} · ${esc(p.country)}</p><h2>${esc(p.name)}</h2><p class="small">${esc(p.year||'Active repository')} · Reviewed ${esc(p.reviewed)}</p></div><div>${link(p.url,'Project ↗')} ${p.repo?link(p.repo,'Repository ↗'):''}</div></div><div class="system-detail">${Object.entries(labels).map(([k,v])=>`<section class="card"><h3>${v}</h3>${surveyCell(deepCell(p,k))}</section>`).join('')}</div><h3 style="margin-top:20px">Evidence inspected</h3><div class="grid">${p.sources.map(source=>`<section class="card"><strong>${link(source.url,source.title||source.url)}</strong><p>${esc(source.evidence||'Linked primary source')}</p></section>`).join('')}</div>`;
}
function surveyCell(c){return `<div class="survey-fact">${tag(c.status,/Unknown|Not reviewed|pending|verification|hypothesis|Proposed|Scope|Open question|open questions|inference/.test(c.status)?'amber':'blue')}<div>${esc(c.value)}</div>${refs(c.sources)}</div>`}
function practiceCell(c){return `<div class="practice-fact">${esc(c.value)}</div>${refs(c.sources)}`}
function labelMember(label,id,basis){return label.members.find(m=>m.id===id&&(basis==='all'||m.basis==='documented'))}
function labelSummary(base,dim,q,url){
 const chosen=(q.get('labels')||'').split(',').filter(Boolean),basis='all';
 const labels=(report.practiceLabels||[]).filter(l=>(dim==='overview'||l.dimension===dim||chosen.includes(l.id))&&(chosen.includes(l.id)||base.some(r=>labelMember(l,r.p.id,basis))));
 const groups=[...new Set(labels.map(l=>l.group||'Other'))];
 const chip=l=>{const mentions=base.filter(r=>l.members.some(m=>m.id===r.p.id&&m.basis==='mention')).length;const hiring=base.filter(r=>l.members.some(m=>m.id===r.p.id&&m.basis==='hiring')).length;const n=base.filter(r=>labelMember(l,r.p.id,basis)).length,options=base.filter(r=>l.members.some(m=>m.id===r.p.id&&m.basis==='option')&&!l.members.some(m=>m.id===r.p.id&&m.basis==='documented')).length;return `<a class="label-chip ${chosen.includes(l.id)?'chosen':''}" data-label="${esc((l.name+' '+l.group).toLowerCase())}" href="${url({labels:(chosen.includes(l.id)?chosen.filter(x=>x!==l.id):[...chosen,l.id]).join(','),page:0})}" title="${n} of ${base.length} workflows; ${basis==='all'?'reviewed evidence, options, hiring and automatic mentions':'documented use'}${options?' · '+options+' with platform options / available support':''}">${esc(l.name)} <b>${n}</b>${options?`<small>${options} optional</small>`:''}${hiring?`<small>${hiring} hiring</small>`:''}${mentions?`<small>${mentions} mentions</small>`:''}</a>`};
 return `<section class="label-summary" aria-label="Practice label counts"><div class="label-summary-head"><strong>Mechanisms <span>· ${base.length} workflows${chosen.length?' before label filters':''}</span></strong><input id="label-search" aria-label="Find a label" placeholder="Find a mechanism…">${chosen.length?`<a href="${url({labels:'',page:0})}">Clear labels</a>`:''}</div><div class="label-counts">${groups.map(group=>`<div class="label-group"><strong>${esc(group)}</strong><div>${labels.filter(l=>(l.group||'Other')===group).map(chip).join('')}</div></div>`).join('')}</div>${chosen.length?'<span class="label-rule">Matching every selected label</span>':''}</section>`
}
function censusView(){
 const q=new URLSearchParams(location.search),cohort=q.get('cohort')||'',search=(q.get('q')||'').toLowerCase(),country=q.get('country')||'',stage=q.get('stage')||'survey',kind=q.get('kind')||'all',dimension=q.get('dimension')||'overview';
 const fields={overview:[['▣ Robot-side compute','hardware',0],['⚙ OS / execution','runtime',0],['↻ Launch / supervision','lifecycle',0],['◉ Recording / artifacts','recording',0]],hardware:[['CPU / cores','hardware',1],['GPU / CUDA','hardware',2],['RAM / topology','hardware',3]],runtime:[['OS / execution','runtime',0],['Resource policy','runtime',2],['IPC / concurrency','runtime',3],['Timing','runtime',4]],lifecycle:[['Launch / ownership','lifecycle',0],['Restart / cancellation','lifecycle',1],['Readiness / operation','lifecycle',2],['Process / machine boundary','lifecycle',3]],recording:[['Capture / format','recording',0],['Buffers / episode structure','recording',1],['Persistence / replay','recording',2],['Integrity / provenance','recording',3]]};
 const dim=fields[dimension]?dimension:'overview',all=[...surveyRows(),...report.profiles.filter(p=>!report.systems.primaryProjects.includes(p.id)).map(p=>({p:{...p,deploymentClass:'simulation'},sys:report.systems.projects[p.id],name:p.org,country:'',search:[p.name,p.org,...Object.values(report.systems.projects[p.id]).flat().map(c=>c.value)].join(' ').toLowerCase()}))],leads=stage==='leads'||stage==='failed',selected=q.get('project');
 if(selected&&!all.some(r=>r.p.id===selected)){const p=report.profiles.find(p=>p.id===selected);if(p&&report.systems.projects[p.id])all.push({p,sys:report.systems.projects[p.id],name:p.org,country:'',search:[p.name,p.org].join(' ').toLowerCase()})}
 let rows=leads?report.census.labs.filter(r=>(stage!=='leads'||(!r.deepReview?.projects?.length&&!r.projects?.length))&&(stage!=='failed'||r.status!=='Page fetched')&&(!country||r.country===country)&&(!search||[r.name,r.institution,r.area].join(' ').toLowerCase().includes(search))):all.filter(r=>(!cohort||r.p.cohort===cohort)&&(!selected||r.p.id===selected)&&(selected||stage!=='survey'||r.p.company||!r.p.deploymentClass||r.p.deploymentClass==='physical deployment')&&(kind==='all'||(kind==='companies'?r.p.company:!r.p.company))&&(!country||r.country===country)&&(!search||r.search.includes(search)));
 const baseRows=rows.slice(),chosen=(q.get('labels')||'').split(',').filter(id=>(report.practiceLabels||[]).some(l=>l.id===id)),basis='all';
 if(!leads&&chosen.length)rows=rows.filter(r=>chosen.every(id=>labelMember(report.practiceLabels.find(l=>l.id===id),r.p.id,basis)));
 rows.sort((a,b)=>(a.p?.name||a.name||'').localeCompare(b.p?.name||b.name||''));
 const url=(changes)=>{const u=new URLSearchParams(q);u.set('view','practices');for(const [k,v]of Object.entries(changes))if(k!=='page')u.set(k,v);u.delete('page');return '?'+u};
 return `<div class="mobile-controls-bar"><span>${rows.length} workflows · ${esc(dim==='runtime'?'Resources & IPC':dim.charAt(0).toUpperCase()+dim.slice(1))}</span><button type="button" id="toggle-survey-controls" aria-controls="survey-controls" aria-expanded="true">Hide controls ↑</button></div><div id="survey-controls"><div class="survey-heading"><h2>Current practices <span>${rows.length}</span></h2>${cohort?`<a href="${url({cohort:''})}">All workflows</a>`:''}${selected?`<a href="${url({project:'',page:0})}">← All workflows</a>`:''}</div>
 <form id="census-filter" class="census-filters"><input name="q" aria-label="Search current practices" placeholder="Search hardware, software, or workflow…" value="${esc(q.get('q')||'')}"><input type="hidden" name="dimension" value="${dim}">${cohort?`<input type="hidden" name="cohort" value="${esc(cohort)}">`:""}<input type="hidden" name="labels" value="${esc(q.get('labels')||'')}">${selected?`<input type="hidden" name="project" value="${esc(selected)}">`:""}<select name="kind" aria-label="Research population"><option value="all" ${kind==='all'?'selected':''}>Labs + companies</option><option value="labs" ${kind==='labs'?'selected':''}>Labs / projects</option><option value="companies" ${kind==='companies'?'selected':''}>Companies</option></select><select name="country" aria-label="Country"><option value="">All countries</option>${[...new Set([...report.census.labs.map(r=>r.country),...all.map(r=>r.country)].filter(Boolean))].sort().map(c=>`<option ${c===country?'selected':''}>${esc(c)}</option>`).join('')}</select><select name="stage" aria-label="Evidence filter"><option value="survey" ${stage==='survey'?'selected':''}>Physical / company evidence</option><option value="all" ${stage==='all'?'selected':''}>Include reference workflows</option></select></form>
 ${leads?'':`<div class="dimension-tabs">${Object.entries({overview:'Overview',hardware:'▣ Compute',runtime:'⚙ Resources & IPC',lifecycle:'↻ Lifecycle',recording:'◉ Recording'}).map(([k,v])=>`<a class="button ${dim===k?'selected':''}" href="${url({dimension:k,page:0})}">${v}</a>`).join('')}</div>`}
 ${leads?'':labelSummary(baseRows,dim,q,url)}</div>
 <div class="table-wrap survey-table"><table><thead><tr><th>${leads?'Lab / group':'Workflow / evidence'}</th>${leads?'<th>Research area</th><th>Source access</th><th>Next sources</th>':fields[dim].map(f=>`<th>${f[0]}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>leads?`<tr><td><strong>${link(r.url,r.name)}</strong><p>${esc(r.institution)} · ${esc(r.country)}</p></td><td>${esc(r.area)}</td><td>${tag(r.status==='Page fetched'?'Landing page reviewed':'Fetch failed',r.status==='Page fetched'?'':'amber')}<p>${r.deepReview?esc(r.deepReview.status)+' · '+esc(r.deepReview.followup):r.status==='Page fetched'?'Paper / repository investigation remains open.':esc(r.error)}</p></td><td>${r.links.slice(0,3).map(l=>link(l.url,l.title.slice(0,60))).join('<br>')}</td></tr>`:`<tr><td><strong><a href="${url({project:r.p.id,page:0})}">${esc(r.p.name)}</a></strong><p>${esc(r.p.org||r.name)} · ${esc(r.p.year)}</p>${r.p.company&&r.p.basics?`<small>${esc(r.p.basics)}</small>`:''}${r.p.deploymentClass&&r.p.deploymentClass!=='physical deployment'?`<small class="workflow-type">${esc(r.p.deploymentClass)}</small>`:''}<div class="workflow-evidence">${r.p.company&&r.p.companyId?`${r.p.website?link(r.p.website,'Company website ↗'):''}`:local(r.p.deep?'lab-project':'projects','Evidence ↗',r.p.id)} ${r.p.repo?link(r.p.repo,'Code ↗'):''}</div>${chosen.length?`<small class="label-match">${chosen.map(id=>{const l=report.practiceLabels.find(l=>l.id===id),m=labelMember(l,r.p.id,basis);return `<span title="${esc(m?.evidence||l.name)}">${esc(l.name)}${m?.basis==='option'?' · option/support':m?.basis==='hiring'?' · hiring evidence':m?.basis==='mention'?' · source mention':''}</span> ${refs(m?.sources||[])}`}).join('<br>')}</small>`:''}</td>${fields[dim].map(([,key,i])=>`<td>${practiceCell(r.sys[key][i])}</td>`).join('')}</tr>`).join('')||'<tr><td colspan="5">No matching setups in the reviewed evidence.</td></tr>'}</tbody></table></div>
 ${selected&&rows.length===1?`<section class="workflow-boundary">${dim==='hardware'?`<strong>Deployment</strong>${practiceCell(rows[0].sys.hardware[0])}`:''}<strong>Inspection boundary</strong>${surveyCell(rows[0].sys[dim==='overview'?'hardware':dim][4])}</section>`:''}`;
}
function applyPracticeFilters(form){
 const q=new URLSearchParams(new FormData(form));
 q.set('view','practices');q.delete('page');
 history.pushState({},'','?'+q);render();
}
document.addEventListener('submit',e=>{if(e.target.id==='census-filter'){e.preventDefault();applyPracticeFilters(e.target)}});
document.addEventListener('change',e=>{if(e.target.matches('#census-filter select'))applyPracticeFilters(e.target.form)});
document.addEventListener('input',e=>{
 if(!e.target.matches('#census-filter input[name="q"]'))return;
 const input=e.target,start=input.selectionStart,end=input.selectionEnd;
 const q=new URLSearchParams(new FormData(input.form));q.set('view','practices');q.delete('page');
 history.replaceState({},'','?'+q);render();
 const next=document.querySelector('#census-filter input[name="q"]');next.focus();next.setSelectionRange(start,end);
});

document.addEventListener('change',e=>{if(e.target.id==='system-project'){const q=new URLSearchParams(location.search);q.set('view','practices');if(e.target.value)q.set('project',e.target.value);else q.delete('project');history.pushState({},'','?'+q);render()}});

function render(){
 const q=new URLSearchParams(location.search);let view=q.get('view')||'practices';
 if(['systems','census'].includes(view)){if(view==='systems'&&!q.has('dimension'))q.set('dimension','hardware');if(q.get('stage')==='deep'||q.get('scope')==='all')q.set('stage','all');if(q.get('stage')==='signals')q.set('stage','survey');view='practices'}
 if(['overview','comparison','findings','product','contacts'].includes(view))view='synthesis';
 if(view==='projects'&&!q.get('project'))view='practices';
 if(!['practices','synthesis','sources','projects','lab-project'].includes(view))view='practices';
 if(q.get('view')!==view){q.set('view',view);history.replaceState({},'','?'+q)}
 document.body.classList.remove('controls-folded');document.body.dataset.view=view;const views=[['practices','Current practices'],['synthesis','Synthesis'],['sources','Sources']];
 const active=['projects','lab-project'].includes(view)?'practices':view;
 $('#nav').innerHTML=views.map(([id,label])=>`<a class="${id===active?'active':''}" ${id===active?'aria-current="page"':''} href="?view=${id}">${label}</a>`).join('');
 $('#main').innerHTML=({practices:censusView,synthesis:currentSynthesis,sources:sourcesView,projects:()=>projects(q.get('project')),'lab-project':()=>deepProject(q.get('project'))}[view])();
 $('#status').textContent='Research snapshot · '+(report.cellAudit?.date||'2026-10-25')+' · '+report.sources.length+' source entries';$('#main').scrollTop=0;setupMobileControls();
 document.title='Robotics Systems Survey · '+(views.find(v=>v[0]===active)?.[1]||'Workflow');
}
document.addEventListener('click',e=>{const a=e.target.closest('a');if(a&&a.getAttribute('href')?.startsWith('?')&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey){e.preventDefault();history.pushState({},'',a.href);render()}});window.addEventListener('popstate',()=>report&&render());fetch('./lab-research.json').then(r=>{if(!r.ok)throw Error('Report unavailable');return r.json()}).then(d=>{report=d;render()}).catch(e=>{$('#main').innerHTML=`<p class="empty">Unable to load the research. ${esc(e.message)} Please refresh.</p>`});



document.addEventListener('input',e=>{if(e.target.id==='label-search'){const value=e.target.value.toLowerCase();document.querySelectorAll('.label-chip').forEach(c=>c.hidden=!c.dataset.label.includes(value));document.querySelectorAll('.label-group').forEach(g=>g.hidden=![...g.querySelectorAll('.label-chip')].some(c=>!c.hidden))}});

function avDroneSummary(){
 const ps=(report.deepSurvey?.projects||[]).filter(p=>p.cohort==='av-drone-2026-10');if(!ps.length)return '';
 return `<section class="av-drone-summary"><div class="section-head"><div><p class="eyebrow">AV & DRONE EXPANSION</p><h2>${ps.length} additional deployment workflows</h2></div><a href="?view=practices&cohort=av-drone-2026-10&dimension=recording">Compare recording & provenance →</a></div><div class="table-wrap"><table><thead><tr><th>Team / workflow</th><th>Existing infrastructure</th><th>Robotics Systems Survey opportunity · hypothesis</th><th>Adoption challenge</th></tr></thead><tbody>${ps.map(p=>`<tr><td><strong>${local('lab-project',esc(p.name),p.id)}</strong><p>${esc(p.buyer||p.org)}</p></td><td>${esc(p.recording)} ${refs(p.fieldRefs.recording)}</td><td>${esc(p.opportunity)}</td><td>${esc(p.adoptionRisk)}</td></tr>`).join('')}</tbody></table></div></section>`;
}

function currentSynthesis(){
 const all=[...surveyRows(),...report.profiles.filter(p=>!report.systems.primaryProjects.includes(p.id)).map(p=>({p:{...p,deploymentClass:'simulation'},sys:report.systems.projects[p.id]}))],scope=new URLSearchParams(location.search).get('population')||'all',rows=all.filter(r=>scope==='all'||(scope==='companies'?r.p.company:!r.p.company));
 const colors={documented:'Documented',mention:'Source mention',hiring:'Hiring',option:'Supported option'};
 const stats=id=>{const l=report.practiceLabels.find(l=>l.id===id);if(!l)return null;const counts={documented:0,mention:0,hiring:0,option:0};for(const r of rows){const ms=l.members.filter(m=>m.id===r.p.id);const b=['documented','hiring','option','mention'].find(b=>ms.some(m=>m.basis===b));if(b)counts[b]++}return {l,counts,total:Object.values(counts).reduce((a,b)=>a+b,0)}};
 const chart=(title,ids,caption)=>{const data=ids.map(stats).filter(x=>x&&x.total).sort((a,b)=>b.total-a.total),max=Math.max(1,...data.map(x=>x.total));return `<section class="insight-chart"><h3>${title}</h3><p>${caption}</p>${data.map(({l,counts,total})=>`<a class="evidence-bar" href="?view=practices&stage=all&kind=${scope==='all'?'all':scope==='companies'?'companies':'labs'}&dimension=${l.dimension}&labels=${l.id}" aria-label="${esc(l.name)}: ${total} matching workflows"><span>${esc(l.name)}</span><svg class="bar-track" viewBox="0 0 100 13" preserveAspectRatio="none" role="img" aria-label="${Object.entries(counts).filter(([,n])=>n).map(([b,n])=>colors[b]+': '+n).join(', ')}">${Object.entries(counts).map(([b,n],i,entries)=>n?`<rect class="basis-${b}" x="${100*entries.slice(0,i).reduce((s,[,v])=>s+v,0)/max}" y="0" width="${100*n/max}" height="13"><title>${colors[b]}: ${n}</title></rect>`:'').join('')}</svg><b>${total}</b></a>`).join('')}</section>`};
 const formatIds=['rosbag','mcap','hdf5','pickle','ulog','zarr','csv'];
 const formats=formatIds.map(stats).filter(x=>x&&x.total);
 const formatRows=rows.filter(r=>formats.some(x=>x.l.members.some(m=>m.id===r.p.id)));
 const multiple=rows.filter(r=>formats.filter(x=>x.l.members.some(m=>m.id===r.p.id)).length>=2).length;
 const launchIds=['systemd','docker','tmux','ros-launch'];const launches=launchIds.map(stats).filter(x=>x&&x.total);
 const launchMulti=rows.filter(r=>launches.filter(x=>x.l.members.some(m=>m.id===r.p.id)).length>=2).length;
 const cards=[['◉',`${formats.length} recording formats`,`${formatRows.length}/${rows.length} workflows have a matching format tag; ${multiple} mention multiple formats.`,`Design implication: preserve native artifacts and join them with a run manifest.`],['↻',`${launchMulti} mixed launch environments`,`Workflows mention at least two of systemd, Docker, tmux and ROS launch.`,`Design implication: integrate with existing supervisors and expose run-level readiness.`],['⌘','Run context spans the stack',`The six stacks below expose readiness, supervision, machine settings and artifacts through different mechanisms.`,`Product hypothesis: connect readiness, machine changes, artifacts and outcomes under one run identity.`]];
 const cases=[
 {id:'comma-ai-openpilot',name:'openpilot',cells:[
 ['Ignition / deviceState gates on-road processes','lifecycle',2],
 ['Managed processes; exit states; SIGINT → SIGKILL','lifecycle',1],
 ['Build/device identity captured; timed OS-change history unreported','recording',3],
 ['60 s segments; overflow drops; disk-space cleanup','recording',1],
 ['Route + Git + hardware serial + dongle ID','recording',3],
 ['Camera/message replay; cross-version determinism unverified','recording',2]]},
 {id:'modalai-voxl2',name:'ModalAI VOXL 2',cells:[
 ['VIO checklist: camera, drift, extrinsics, PX4 odometry','lifecycle',2],
 ['systemd services; operator diagnosis / restart','lifecycle',1],
 ['Service/CPU snapshots + journal; settings timeline unreported','runtime',2],
 ['MPA + ULog; arm triggers; free-space stop','recording',1],
 ['logNNNN + notes + PX4 parameters / versions','recording',3],
 ['Sensor replay; VIO benchmark pose / CPU metrics','recording',2]]},
 {id:'tudelft-event-orin',name:'TU Delft Event-Orin',cells:[
 ['Manual device, link, flight-mode and commander checks','lifecycle',2],
 ['tmux + container; manual start/stop; export error checks','lifecycle',0],
 ['MAXN + max fan at boot; jtop power reading','runtime',2],
 ['MCAP: 100 MiB cache; stop before log export','recording',1],
 ['Pinned PX4 / ROS components; no run manifest in launcher','recording',3],
 ['Foxglove / HDF5; separate Gazebo mode tests','recording',2]]},
 {id:'tidybot',name:'TidyBot++',cells:[
 ['Reset arm/base; initial base pose within 1 cm','lifecycle',2],
 ['tmux; gamepad service restarts; finally closes environment','lifecycle',1],
 ['SCHED_FIFO; performance governor; one-slot command queue','runtime',2],
 ['RAM episode; async flush joined before next episode','recording',1],
 ['Timestamp folder + aligned samples; code/config hash absent','recording',3],
 ['Action / observation replay on hardware or MuJoCo','recording',2]]},
 {id:'company-physical-intelligence',name:'OpenPI / DROID',cells:[
 ['Choose cameras/instruction; server health endpoint','lifecycle',2],
 ['Separate client/server; startup retry; deferred Ctrl+C','lifecycle',1],
 ['15 Hz target; example has no affinity / cgroup setup','runtime',2],
 ['RAM-held rollout; MP4 / CSV save; synchronous NumPy dumps','recording',2],
 ['Timestamp paths + outcomes; inference counter resets','recording',3],
 ['Video/outcomes + input/output dumps; replay contract unreported','recording',0]]},
 {id:'tum-edgar',name:'TUM EDGAR',cells:[
 ['Simulation before road testing; vehicle gate unpublished','lifecycle',2],
 ['CARLA/HIL launch; physical-car supervisor unpublished','lifecycle',0],
 ['Onboard x86 HPC; quotas/change history unpublished','runtime',2],
 ['PTP-aligned ROS bags; public shared data excludes cameras','recording',0],
 ['Route/scenario artifacts; cross-run manifest unspecified','recording',3],
 ['CommonRoad → simulated driving: development project','recording',2]]}
 ];
 const caseHtml=cases.map(({id,name,cells})=>{const r=all.find(r=>r.p.id.includes(id));if(!r)return '';return `<tr><th scope="row"><a href="?view=practices&project=${encodeURIComponent(r.p.id)}&dimension=overview">${name} ↗</a></th>${cells.map(([text,dim,index])=>`<td><a class="lifecycle-evidence" href="?view=practices&project=${encodeURIComponent(r.p.id)}&dimension=${dim}">${esc(text)}</a>${refs(r.sys[dim][index].sources)}</td>`).join('')}</tr>`}).join('');

 return `<div class="section-head"><div><p class="eyebrow">EVIDENCE → INSIGHTS</p><h2>Where a shared experiment layer could earn its place</h2></div><div class="insight-population">${[['all','All workflows'],['labs','Labs / projects'],['companies','Companies']].map(([id,label])=>`<a class="button ${scope===id?'selected':''}" href="?view=synthesis&population=${id}">${label}</a>`).join('')}</div></div>
 <div class="insight-context"><strong>${rows.length} workflow records</strong><span>Research snapshot ${esc(report.cellAudit.date)}</span><span>Chart counts track evidence coverage in this survey.</span></div>
 <div class="insight-cards">${cards.map(([glyph,title,data,implication])=>`<article><span class="insight-glyph">${glyph}</span><h3>${title}</h3><p>${data}</p><strong>${implication}</strong></article>`).join('')}</div>
 <div class="insight-legend">${Object.entries(colors).map(([id,name])=>`<span><i class="basis-${id}"></i>${name}</span>`).join('')}<span>One count per workflow per label · labels can overlap</span></div>
 <div class="insight-charts">${chart('◉ Recording formats',formatIds,'Multiple formats create artifact-joining work.')}${chart('↻ Launch & supervision',['ros-launch','docker','systemd','tmux'],'These mechanisms can coexist within one deployment.')}${chart('⚙ Execution ecosystem',['ros2','ros1','orin','x86'],'Framework and hardware tags identify integration surfaces.')}</div>
 <div class="section-head insight-case-head"><div><h3>What existing stacks provide across an experiment</h3><span class="small muted">Six selected stacks · each cell opens its supporting workflow evidence</span></div></div>
 <div class="table-wrap insight-cases"><table><thead><tr><th>Workflow</th><th>① Setup & readiness</th><th>② Execution & recovery</th><th>③ Machine state & history</th><th>④ Recording & integrity</th><th>⑤ Identity & provenance</th><th>⑥ Analysis & comparison</th></tr></thead><tbody>${caseHtml}</tbody></table></div>
 <div class="insight-decision"><strong>Next evidence to collect</strong><span>For each team: one failed run, the missing evidence that blocked diagnosis, and who would adopt a fix.</span><a href="?view=practices&dimension=recording">Inspect all workflows →</a></div>`;
}

// The table owns vertical scrolling; keep its controls recoverable on short screens.
function setupMobileControls(){
 const table=document.querySelector('.survey-table'),button=document.querySelector('#toggle-survey-controls');
 if(!table||!button)return;
 const mobile=()=>matchMedia('(max-width: 750px)').matches;
 if(mobile())document.querySelector('#census-filter input[name="q"]').placeholder='Search…';
 let last=table.scrollTop,travel=0,settling=false;
 function fold(value){
  if(!mobile())return;
  document.body.classList.toggle('controls-folded',value);
  button.setAttribute('aria-expanded',String(!value));
  button.textContent=value?'Show controls ↓':'Hide controls ↑';
  settling=true;
  requestAnimationFrame(()=>{last=table.scrollTop;travel=0;settling=false});
 }
 button.addEventListener('click',()=>fold(!document.body.classList.contains('controls-folded')));
 table.addEventListener('scroll',()=>{
  const y=table.scrollTop,delta=y-last;last=y;
  if(!mobile()||settling||!delta)return;
  travel=Math.sign(delta)===Math.sign(travel)?travel+delta:delta;
  if(document.body.classList.contains('controls-folded')){
   if(travel < -28||y===0)fold(false);
  }else if(y>48&&travel>36&&!document.querySelector('#survey-controls :focus'))fold(true);
 },{passive:true});
}
