// Generate crawlable pages from the same data and renderers as the interactive site.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

type Page={view:string;file:string;label:string;title:string;description:string};
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const CHECK_ONLY=process.argv.includes('--check');
const ASSETS=['labs.css','corl-summary.css','site.js','corl-summary.js','synthesis.js','labs.js'];
const assetURLs=new Map<string,string>();
for(const asset of ASSETS){
 const content=await readFile(path.join(ROOT,asset));
 assetURLs.set(asset,`./${asset}?v=${createHash('sha256').update(content).digest('hex').slice(0,12)}`);
}
const data=JSON.parse(await readFile(path.join(ROOT,'lab-research.json'),'utf8'));
const location={search:''};
const context=vm.createContext({URL,URLSearchParams,console,DATA:data,location,
 document:{addEventListener(){}},window:{addEventListener(){}},fetch:()=>new Promise(()=>{})});
for(const asset of ['site.js','corl-summary.js','synthesis.js','labs.js'])vm.runInContext(await readFile(path.join(ROOT,asset),'utf8'),context);
vm.runInContext('report=DATA;',context);
const pages=vm.runInContext('SITE_PAGES',context) as Page[];
const siteURL=vm.runInContext('SITE_URL',context) as string;
const siteName=vm.runInContext('SITE_NAME',context) as string;
const escape=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const renderers:Record<string,string>={practices:'censusView()', 'corl-summary':'corlSummary()',synthesis:'currentSynthesis()',sources:'sourcesView()'};
async function output(file:string,content:string){
 if(CHECK_ONLY){
  const actual=await readFile(path.join(ROOT,file),'utf8');
  if(actual!==content)throw Error(`${file} is stale; run node scripts/build_site.mts`);
 }else await writeFile(path.join(ROOT,file),content);
}
for(const page of pages){
 location.search='?view='+page.view;
 const rendered=vm.runInContext(renderers[page.view],context) as string;
 // Static cross-view links must work before JavaScript has loaded.
 const content=rendered.replace(/href="\?([^"<>]*)"/g,(_match,search:string)=>{
  const query=new URLSearchParams(search.replaceAll('&amp;','&'));
  const view=query.get('view')||page.view;
  context.linkView=view;context.linkQuery=query;
  return `href="${escape(vm.runInContext('siteHref(linkView,linkQuery)',context))}"`;
 });
 const canonical=siteURL+page.file;
 const navigation=pages.map(item=>`<a class="${item===page?'active':''}" ${item===page?'aria-current="page"':''} href="./${item.file}">${item.label}</a>`).join('');
 const schema={'@context':'https://schema.org','@type':'CollectionPage',name:page.title,description:page.description,url:canonical,isPartOf:{'@type':'WebSite',name:siteName,url:siteURL}};
 const html=`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(page.title)}</title>
<meta name="description" content="${escape(page.description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${siteName}">
<meta property="og:title" content="${escape(page.title)}">
<meta property="og:description" content="${escape(page.description)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escape(page.title)}">
<meta name="twitter:description" content="${escape(page.description)}">
<link rel="sitemap" type="application/xml" href="./sitemap.xml">
<script id="page-schema" type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>
<script src="${assetURLs.get('site.js')}"></script>
<link rel="stylesheet" href="${assetURLs.get('labs.css')}">
<link rel="stylesheet" href="${assetURLs.get('corl-summary.css')}">
${['corl-summary.js','synthesis.js','labs.js'].map(asset=>`<script defer src="${assetURLs.get(asset)}"></script>`).join('\n')}
</head>
<body data-view="${page.view}" data-prerendered="true"><header><a class="brand" href="./">${siteName}</a><span class="desk">Onboard compute · Runtime · Experiments</span><a href="https://github.com/Cutuy/robotics-systems-survey">Repository ↗</a></header><nav id="nav" aria-label="Research views">${navigation}</nav><main id="main" aria-live="polite">${content}</main><footer><span id="status">Research snapshot · ${escape(data.reviewed||data.cellAudit.date)} · ${data.sources.length} source entries</span><a href="./lab-research.json" download>Download survey JSON ↓</a></footer></body>
</html>
`;
 await output(page.file||'index.html',html);
 if(page.view==='practices')await output('labs.html',html);
}
await output('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page=>`  <url><loc>${escape(siteURL+page.file)}</loc></url>`).join('\n')}
</urlset>
`);
console.log(`${CHECK_ONLY?'Verified':'Generated'} ${pages.length} static views, the legacy entry point and sitemap.`);
