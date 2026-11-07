'use strict';
const SITE_URL='https://cutuy.github.io/robotics-systems-survey/';
const SITE_NAME='Robotics Systems Survey';
const SITE_PAGES=[
 {view:'practices',file:'',label:'Current practices',title:'Robotics Systems Survey: Onboard Compute, Runtime & Recording',description:'Compare source-linked robotics workflows: onboard CPUs and GPUs, operating systems, IPC, process lifecycle, data recording and experiment provenance.'},
 {view:'corl-summary',file:'corl-summary.html',label:'CoRL summary',title:'CoRL 2026 Robot Systems: Compute, Runtime & Data | Robotics Systems Survey',description:'Explore systems evidence from CoRL 2026 papers: robot compute, CPU, GPU, memory, software, communication, timing, process management and recording.'},
 {view:'synthesis',file:'synthesis.html',label:'Synthesis',title:'Robotics Systems Synthesis: Deployment Patterns | Robotics Systems Survey',description:'Compare deployment patterns across robotics labs and companies: compute placement, resource controls, IPC, lifecycle, recording and provenance.'},
 {view:'sources',file:'sources.html',label:'Sources',title:'Robotics Systems Research Sources | Robotics Systems Survey',description:'Browse the papers, code repositories and platform documentation supporting the Robotics Systems Survey and its CoRL 2026 systems findings.'},
];
function sitePage(view){return SITE_PAGES.find(page=>page.view===view)||SITE_PAGES[0]}
function siteView(query){
 const explicit=query.get('view');
 if(explicit)return explicit;
 return SITE_PAGES.find(page=>page.file&&location.pathname?.endsWith('/'+page.file))?.view||'practices';
}
function siteHref(view,query=new URLSearchParams()){
 const page=sitePage(view),params=new URLSearchParams(query);
 if(page.view===view)params.delete('view');else params.set('view',view);
 const search=params.toString();
 return './'+page.file+(search?'?'+search:'');
}
function updateSiteMetadata(view){
 const page=sitePage(view),url=SITE_URL+page.file;
 document.title=page.title;
 for(const [selector,attribute,value] of [
  ['meta[name="description"]','content',page.description],
  ['link[rel="canonical"]','href',url],
  ['meta[property="og:title"]','content',page.title],
  ['meta[property="og:description"]','content',page.description],
  ['meta[property="og:url"]','content',url],
  ['meta[name="twitter:title"]','content',page.title],
  ['meta[name="twitter:description"]','content',page.description],
 ])document.querySelector(selector)?.setAttribute(attribute,value);
 const schema=document.querySelector('#page-schema');
 if(schema) schema.textContent=JSON.stringify({'@context':'https://schema.org','@type':'CollectionPage',name:page.title,description:page.description,url,isPartOf:{'@type':'WebSite',name:SITE_NAME,url:SITE_URL}});
}
// Send legacy query links to the matching static page before the deferred app loads.
if(typeof location!=='undefined'&&location.pathname){
 const query=new URLSearchParams(location.search),view=siteView(query);
 if(SITE_PAGES.some(page=>page.view===view)){
  const target=new URL(siteHref(view,query),location.href);
  if(target.pathname!==location.pathname)location.replace(target.href);
 }
}
