'use strict';
const SYNTHESIS_SECTIONS = [
 ['hardware','Compute','compute'], ['runtime','Resources & IPC','communication'],
 ['lifecycle','Lifecycle','operations'], ['recording','Recording','data'],
];
const SYNTHESIS_EXAMPLES = {
 hardware:[
  ['deep-av-tum-edgar-target-hardware-autonomous-driving-experiments','TUM EDGAR','Published platform',[
   ['Onboard server','16-core AMD · 132 GB RAM · RTX A6000'],['Data alignment','PTP-synchronized vehicle streams'],['Development','Separate simulator and vehicle data center']]],
  ['corl26-JiMWz6U93i','AsyncVLA','Paper deployment',[
   ['Robot','Jetson Orin edge adapter'],['Workstation','RTX 4090 base VLA'],['Association','Returned embeddings retain image-capture timestamps']]],
  ['corl26-8CDEvBQA6x','AutoDex','Paper + released implementation',[
   ['Topology','Robot PC coordinates capture PCs'],['Capture','20 cameras · hardware triggers'],['Artifacts','Shared storage for captures and candidates']]],
  ['droneexp-modalai-voxl2-px4-ros2-companion-flight','ModalAI VOXL 2','Platform documentation',[
   ['Onboard','QRB5165 compute, cameras and flash'],['Processes','Linux services + PX4'],['Observability','Service state and CPU-use snapshots']]],
 ],
 runtime:[
  ['tidybot','TidyBot++','Inspected implementation',[
   ['Scheduling','SCHED_FIFO · performance governor'],['Command buffer','One-slot queue'],['Ownership','Local control services and tmux sessions']]],
  ['droneexp-modalai-voxl2-px4-ros2-companion-flight','ModalAI VOXL 2','Platform documentation',[
   ['Local transport','POSIX named pipes'],['Images','Shared ION/DMA buffers'],['PX4 / ROS 2','Local UDP uXRCE-DDS interface']]],
  ['corl26-JiMWz6U93i','AsyncVLA','Paper deployment',[
   ['Rates','8 Hz edge adapter · 5 Hz base VLA'],['Transport','ROS image and action messages over Wi-Fi'],['Freshness','Timestamped observation history']]],
  ['corl26-05nE8s5e7I','FlashVLA','Paper + released implementation',[
   ['Overlap','67.3 ms inference alongside 30 Hz execution'],['GPU execution','CUDA Graph reuse · kernel fusion'],['Actions','Four buffer slots · 20-action chunks · execute 16']]],
 ],
 lifecycle:[
  ['deep-av-comma-ai-openpilot-onroad-runtime-and-route-logging','openpilot','Inspected implementation',[
   ['Start gate','deviceState starts on-road processes'],['Supervision','Manager starts/stops processes and publishes status'],['Shutdown','SIGINT followed by termination escalation']]],
  ['droneexp-modalai-voxl2-px4-ros2-companion-flight','ModalAI VOXL 2','Platform documentation',[
   ['Supervisor','systemd services'],['Readiness','VIO, camera, pose and odometry checks'],['Diagnosis','Service inspection and journal']]],
  ['corl26-OckqYiY2QM','EagleVLA','Released managed client',[
   ['Ownership','Client spawns and shuts down the server'],['Readiness','Health checks with a startup timeout'],['Failure','Detects early child exit']]],
  ['corl26-8CDEvBQA6x','AutoDex','Released implementation',[
   ['Ownership','Persistent SSH/nohup capture daemons'],['Trial cleanup','Bounded stop calls; camera reuse'],['Recovery','Unsafe or invalid-CUDA states require an operator']]],
  ['company-physical-intelligence','OpenPI / DROID','Inspected reference workflow',[
   ['Bringup','Separate policy client and server'],['Connection','Startup retry and health checks'],['Interruption','Deferred Ctrl+C during critical operations']]],
 ],
 recording:[
  ['deep-av-comma-ai-openpilot-onroad-runtime-and-route-logging','openpilot','Inspected implementation',[
   ['Artifacts','rlog / qlog + H.265 video · 60-second segments'],['Identity','Route, segment, Git version and hardware identity'],['Replay','Camera and message replay tools']]],
  ['droneexp-tudelft-event-orin-mcap-flight-capture','TU Delft Event-Orin','Inspected flight-capture workflow',[
   ['Artifacts','MCAP + separate PX4/MAVLink logs'],['Capture','ROS 2 intra-process camera/recorder container'],['Completion','Stop recording before USB export']]],
  ['tidybot','TidyBot++','Inspected implementation',[
   ['Buffering','Episode retained in RAM'],['Persistence','Async flush joins before the next episode'],['Replay','Actions / observations on hardware or MuJoCo']]],
  ['corl26-8CDEvBQA6x','AutoDex','Paper + released implementation',[
   ['Artifacts','Video, robot states, calibration and outcomes'],['Manifest','Run/episode IDs · clocks · host/PID · SHA-256 references'],['Integrity','Incomplete captures are quarantined']]],
  ['corl26-QAHhXvXHtb','YUBI','Paper + released implementation',[
   ['Capture','Synchronized rosbag2 streams'],['Selection','Operator marks and accepts episodes'],['Persistence','Accepted episodes upload to S3-compatible storage']]],
  ['deep-av-tum-edgar-target-hardware-autonomous-driving-experiments','TUM EDGAR','Reported practice + scoped project work',[
   ['Current capture','PTP-aligned ROS bags; published data excludes cameras'],['Development scope','MCAP/CommonRoad recording is evaluation-project work'],['Replay scope','CommonRoad scenarios drive simulation evaluation']]],
 ],
};
function synthesisRows(){
 return [...surveyRows(),...report.profiles.filter(p=>!report.systems.primaryProjects.includes(p.id)).map(p=>({p:{...p,deploymentClass:'simulation'},sys:report.systems.projects[p.id]}))];
}
function synthesisEvidenceIndex(rows,scope){
 const groups=[['Compute',['orin','x86','ram16']],['Runtime',['ros2','ros1','shared-memory','zeromq','rt']],['Lifecycle',['ros-launch','docker','systemd','tmux']],['Recording',['rosbag','mcap','hdf5','zarr','ulog','numpy']]];
 const basisOrder=['documented','hiring','option','mention'];
 const names={documented:'documented',hiring:'hiring',option:'supported option',mention:'source mention'};
 return `<details class="cs-scope sy-index"><summary>Explore mechanism evidence</summary><div class="cs-topic-grid">${groups.map(([title,ids])=>{
  const items=ids.map(id=>{
   const label=report.practiceLabels.find(l=>l.id===id);if(!label)return '';
   const counts=Object.fromEntries(basisOrder.map(basis=>[basis,0]));
   for(const row of rows){const basis=basisOrder.find(basis=>label.members.some(m=>m.id===row.p.id&&m.basis===basis));if(basis)counts[basis]++;}
   const total=Object.values(counts).reduce((sum,n)=>sum+n,0);if(!total)return '';
   const query=new URLSearchParams({view:'practices',dimension:label.dimension,labels:id,kind:scope==='all'?'all':scope});
   return `<li><a href="?${esc(query)}">${esc(label.name)}</a><span>${Object.entries(counts).filter(([,n])=>n).map(([basis,n])=>`${n} ${names[basis]}${n>1&&['option','mention'].includes(basis)?'s':''}`).join(' · ')}</span></li>`;
  }).join('');
  return `<div><h3>${title}</h3><ul>${items||'<li>-</li>'}</ul></div>`;
 }).join('')}</div><p>Counts describe unique matching workflow records per label. Evidence types remain separate; labels can overlap.</p></details>`;
}
function currentSynthesis(){
 const query=new URLSearchParams(location.search),requested=query.get('population');
 const scope=['all','labs','companies'].includes(requested)?requested:'all';
 const rows=synthesisRows().filter(row=>scope==='all'||(scope==='companies'?row.p.company:!row.p.company));
 const selected=summarySelection(SYNTHESIS_SECTIONS);
 const examples=dimension=>{
  const items=SYNTHESIS_EXAMPLES[dimension].filter(([id])=>rows.some(row=>row.p.id===id));
  return `<div class="cs-topic-grid sy-examples">${items.map(([id,name,basis,facts])=>{
   const href=new URLSearchParams({view:'practices',project:id,dimension});
   return summaryTopic(`<a href="?${esc(href)}">${esc(name)}</a>`,`<p class="sy-basis">${esc(basis)}</p>${summarySpecs(facts)}`);
  }).join('')||'<p class="muted">No selected examples in this population.</p>'}</div>`;
 };
 const chapter=(id,glyph,title,intro,content)=>`<section class="cs-chapter" aria-labelledby="synthesis-${id}"><div class="cs-chapter-head">${summaryGlyph(glyph)}<h2 id="synthesis-${id}">${title}</h2><p>${intro}</p></div><div class="cs-chapter-body">${content}</div></section>`;
 const sections={
 hardware:chapter('hardware','compute','Place each workload','Record which machine owns control, inference and capture.',`
  <div class="cs-topologies">${summaryTopology('onboard','Onboard','Control and inference share a robot computer')}${summaryTopology('workstation','External compute','A policy server depends on the robot link')}${summaryTopology('split','Split execution','Edge and host models progress independently')}</div>
  <p class="sy-principle">Design hypothesis: describe host roles, device ownership and cross-machine dependencies in one run configuration.</p>${examples('hardware')}`),
 runtime:chapter('runtime','communication','Make boundaries observable','Transport, scheduling and data age affect the control loop.',`
  <div class="cs-route" aria-label="Signals across the runtime"><div><span>Observation</span><strong>Capture time</strong><small>Source identity · timestamp</small></div><span class="cs-arrow" aria-hidden="true">→</span><div><span>Inference</span><strong>Queue & completion</strong><small>Device · latency · deadline</small></div><span class="cs-arrow" aria-hidden="true">→</span><div><span>Control</span><strong>Execution time</strong><small>Action age · cancellation</small></div></div>
  <p class="sy-principle">Design hypothesis: instrument the existing IPC paths and track timing at every handoff.</p>${examples('runtime')}`),
 lifecycle:chapter('lifecycle','operations','Own the whole lifecycle','A running process still needs a readiness contract.',`
  <ol class="cs-lifecycle"><li><strong>Start</strong><small>Claim devices · launch dependencies</small></li><li><strong>Ready</strong><small>Health · calibration · first data</small></li><li><strong>Operate</strong><small>State · faults · recovery</small></li><li><strong>Finish</strong><small>Stop · drain · release</small></li></ol>
  <p class="sy-principle">Design hypothesis: connect existing supervisors to explicit ready, failed and stopped states.</p>${examples('lifecycle')}`),
 recording:chapter('recording','data','Connect the artifacts','Keep native formats and preserve the context needed to interpret them.',`
  <div class="cs-artifact-map"><div class="cs-run"><span>Shared run identity</span><strong>Run manifest</strong><small>Host roles · clocks · versions · outcome</small></div><div class="cs-artifacts"><div><strong>Native recordings</strong><span>Messages · images · video · trajectories</span></div><div><strong>Execution evidence</strong><span>Readiness · process state · failures</span></div><div><strong>Reproduction context</strong><span>Calibration · configuration · checkpoints</span></div></div></div>
  <p class="sy-principle">Design hypothesis: join recordings, process history and provenance through one manifest; record the replay contract for each artifact.</p>${examples('recording')}`),
 };
 return `<div class="corl-summary synthesis-summary"><div class="cs-hero"><div><p class="cs-kicker">Survey synthesis / evidence to design</p><h1>What connects a robot run.</h1><p class="cs-deck">Patterns across deployed stacks and the CoRL research workflows.</p></div><a class="cs-open-table" href="?view=practices&kind=${scope}">Explore the evidence →</a></div>
 <div class="sy-population"><div class="dimension-tabs" role="group" aria-label="Workflow population">${[['all','All workflows'],['labs','Labs / projects'],['companies','Companies']].map(([id,label])=>`<a class="button ${scope===id?'selected':''}" ${scope===id?'aria-current="true"':''} href="?view=synthesis&population=${id}&section=${selected}">${label}</a>`).join('')}</div><span>${rows.length} workflow records</span></div>
 ${summaryControls('synthesis',SYNTHESIS_SECTIONS,selected,scope)}
 ${Object.entries(sections).filter(([id])=>selected==='overview'||selected===id).map(([,html])=>html).join('')}
 ${synthesisEvidenceIndex(rows,scope)}
 <details class="cs-scope"><summary>What to validate next</summary><div class="cs-topic-grid">${summaryTopic('Observed evidence','<p>Named implementations establish concrete integration points. Research, reference code and production platforms have different operating scope.</p>')}${summaryTopic('Product hypothesis','<p>Test one failed run with a team: which missing artifact or process transition prevented diagnosis, who needs it, and whether they would adopt a shared run layer.</p>')}</div></details>
 </div>`;
}
