'use strict';
const CORL_SUMMARY_COHORT = 'corl-2026-full-scan';
const CORL_SUMMARY_CHAPTERS = [
 ['compute','Compute','hardware'], ['software','Software','runtime'],
 ['communication','Communication','runtime'], ['timing','Timing','runtime'],
 ['operations','Processes','lifecycle'], ['data','Data & replay','recording'],
];
const CORL_SUMMARY_GLYPHS = {
 compute:'<rect x="7" y="7" width="18" height="18" rx="3"/><path d="M12 2v5m8-5v5M12 25v5m8-5v5M2 12h5m-5 8h5m18-8h5m-5 8h5"/><rect x="12" y="12" width="8" height="8" rx="1"/>',
 software:'<path d="m11 8-8 8 8 8m10-16 8 8-8 8M18 5l-4 22"/>',
 communication:'<rect x="2" y="11" width="8" height="10" rx="2"/><rect x="22" y="2" width="8" height="10" rx="2"/><rect x="22" y="20" width="8" height="10" rx="2"/><path d="M10 16h6V7h6m-6 9v9h6"/>',
 timing:'<circle cx="16" cy="17" r="11"/><path d="M16 10v7l5 3M12 2h8M16 2v4m9 3 3-3"/>',
 operations:'<circle cx="6" cy="16" r="4"/><circle cx="26" cy="16" r="4"/><path d="M10 16h12m-5-4 4 4-4 4M6 7V3h20v4M6 25v4h20v-4"/>',
 data:'<path d="M4 8c0-6 24-6 24 0s-24 6-24 0Zm0 0v16c0 6 24 6 24 0V8M4 16c0 6 24 6 24 0"/>',
};
function summaryGlyph(name){return `<svg class="cs-glyph" viewBox="0 0 32 32" aria-hidden="true" focusable="false">${CORL_SUMMARY_GLYPHS[name]}</svg>`}
function summaryEvidence(paperId,label,dimension='overview'){
 const record=report.deepSurvey.projects.find(p=>p.paperId===paperId&&p.cohort===CORL_SUMMARY_COHORT);
 if(!record)throw Error(`Summary evidence missing: ${paperId}`);
 return `<a href="?view=practices&cohort=${CORL_SUMMARY_COHORT}&project=${encodeURIComponent(record.id)}&dimension=${dimension}">${esc(label)}<svg class="cs-link-arrow" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 9 9 3M3 3h6v6"/></svg></a>`;
}
function summaryTopic(title,body,evidence=''){
 return `<div class="cs-topic"><h3>${title}</h3>${body}${evidence?`<div class="cs-evidence">${evidence}</div>`:''}</div>`;
}
function summarySpecs(rows){return `<dl class="cs-specs">${rows.map(([key,value])=>`<div><dt>${key}</dt><dd>${value}</dd></div>`).join('')}</dl>`}
function summaryChapter(id,title,intro,content){
 const chapter=CORL_SUMMARY_CHAPTERS.findIndex(item=>item[0]===id);
 return `<section class="cs-chapter" id="summary-${id}" aria-labelledby="summary-${id}-title"><div class="cs-chapter-head"><span class="cs-index">0${chapter+1}</span>${summaryGlyph(id)}<h2 id="summary-${id}-title">${title}</h2><p>${intro}</p></div><div class="cs-chapter-body">${content}</div></section>`;
}
function summaryTopology(kind,title,subtitle){
 const drawings={
  onboard:'<rect class="cs-machine" x="22" y="16" width="236" height="108" rx="12"/><text x="40" y="39">ROBOT</text><rect x="40" y="54" width="88" height="46" rx="5"/><text x="84" y="81" text-anchor="middle">Sensors</text><path d="M132 77h26m-5-4 5 4-5 4"/><rect x="166" y="54" width="74" height="46" rx="5"/><text x="203" y="81" text-anchor="middle">Policy</text>',
  workstation:'<rect class="cs-machine" x="8" y="20" width="94" height="100" rx="12"/><text x="55" y="43" text-anchor="middle">ROBOT</text><rect x="22" y="56" width="66" height="42" rx="5"/><text x="55" y="81" text-anchor="middle">Control</text><path d="M108 70h56m-5-4 5 4-5 4m-51 16h51m-46-4-5 4 5 4"/><rect class="cs-machine" x="174" y="20" width="98" height="100" rx="12"/><text x="223" y="43" text-anchor="middle">HOST</text><rect x="188" y="56" width="70" height="42" rx="5"/><text x="223" y="81" text-anchor="middle">Policy</text>',
  split:'<rect class="cs-machine" x="8" y="20" width="112" height="100" rx="12"/><text x="64" y="43" text-anchor="middle">ROBOT</text><rect x="20" y="56" width="88" height="42" rx="5"/><text x="64" y="81" text-anchor="middle">Edge model</text><path d="M126 70h28m-5-4 5 4-5 4m-23 16h23m-18-4-5 4 5 4"/><rect class="cs-machine" x="164" y="20" width="108" height="100" rx="12"/><text x="218" y="43" text-anchor="middle">HOST</text><rect x="176" y="56" width="84" height="42" rx="5"/><text x="218" y="81" text-anchor="middle">Base model</text>',
 };
 return `<figure class="cs-topology"><svg viewBox="0 0 280 140" role="img" aria-label="${esc(title+': '+subtitle)}">${drawings[kind]}</svg><figcaption><strong>${title}</strong><span>${subtitle}</span></figcaption></figure>`;
}
function corlSummary(){
 const records=report.deepSurvey.projects.filter(p=>p.cohort===CORL_SUMMARY_COHORT);
 const e=summaryEvidence;
 const compute=summaryChapter('compute','Where computation lives','From a microcontroller to a distributed workcell.',`
 <div class="cs-topologies">
 ${summaryTopology('onboard','Onboard','Sensing and inference on the robot')}
 ${summaryTopology('workstation','External workstation','Local control, networked policy')}
 ${summaryTopology('split','Split inference','Small edge model, large remote model')}
 </div>
 <div class="cs-evidence cs-topology-evidence">${e('OckqYiY2QM','EagleVLA','hardware')}${e('2tjuz95jmb','Reactive motion planning','hardware')}${e('JiMWz6U93i','AsyncVLA','hardware')}</div>
 <div class="cs-topic-grid">
 ${summaryTopic('Onboard platforms',summarySpecs([['GPU computers','Orin Nano / NX / AGX · Thor · TX2'],['CPU computers','Intel NUC · LattePanda · Raspberry Pi'],['Microcontroller','ESP32-S3']]),e('DMljKr2f4O','VertexCBF','hardware')+e('Gpc0nCixhZ','Raspberry Pi robots','hardware')+e('yzejD0WIk9','Flapping-wing robot','hardware'))}
 ${summaryTopic('CPU',summarySpecs([['Workstations','Intel Core i7 / i9 / Ultra · AMD Ryzen'],['Embedded control','RK3588 · Arm Cortex-A78AE'],['Microcontroller','ESP32-S3 · 2 cores · 240 MHz']]),e('4IT3fcnny2','SSR','hardware')+e('NzvfxoRvOC','Whole-body tracking','hardware'))}
 ${summaryTopic('GPU',summarySpecs([['Deployment examples','RTX 4090 · RTX 5090 · RTX A4000 · RTX 2060'],['Onboard inference','Jetson GPUs'],['Training scope','FlashVLA: 8 H200s; deployed on A4000']]),e('FFB8qNJwV2','REACT','hardware')+e('2dEfANeQL7','GRAIL','hardware')+e('05nE8s5e7I','FlashVLA','hardware'))}
 ${summaryTopic('System RAM',summarySpecs([['Orin variants','Nano 8 GB · NX 16 GB · AGX 64 GB'],['Host examples','NUC 16 GB · workstations 32–128 GB'],['Microcontroller SRAM','512 KB on ESP32-S3']]),e('mjvsJNQuFV','FT-WBC','hardware')+e('Sal8Urvt1F','PathPainter','hardware')+e('Hi8mV09nOi','CoFL-S','hardware')+e('0cK9Wf9Eeq','ENPIRE','hardware'))}
 ${summaryTopic('GPU memory & footprint',summarySpecs([['Capacity','REACT: 24 GB VRAM'],['Peak allocation','IntentNav: 5.58 GB'],['Engine footprint','SOLO: 7.56 MB during onboard operation']]),e('FFB8qNJwV2','REACT','hardware')+e('6RJsxVCnhB','IntentNav','hardware')+e('JWkaXdmqKb','SOLO','hardware'))}
 ${summaryTopic('Placement & scale','<p>Control and inference may use separate computers. Capture can span several hosts.</p><p>SSR: RK3588 control + Orin inference.<br>AutoDex: robot PC + capture PCs.</p>',e('4IT3fcnny2','SSR','lifecycle')+e('8CDEvBQA6x','AutoDex','lifecycle'))}
 </div>`);
 const software=summaryChapter('software','The execution stack','OS, model runtime and resource policy are separate choices.',`<div class="cs-topic-grid">
 ${summaryTopic('Operating systems',summarySpecs([['Workstations','Ubuntu 20.04 / 22.04 / 24.04'],['Jetson','L4T · JetPack'],['Other roles','Windows: VIVE localization host'],['Embedded','FreeRTOS']]),e('PL6UDcy9Eu','FingerViP','runtime')+e('0cK9Wf9Eeq','ENPIRE','runtime')+e('9ih6YlxhI5','PAINT','runtime')+e('2tjuz95jmb','VIVE host','hardware')+e('yzejD0WIk9','FreeRTOS','runtime'))}
 ${summaryTopic('Languages',summarySpecs([['Servers & nodes','Python'],['Controllers','C++'],['Microcontroller inference','Exported static C'],['Recording conversion','Rust in YUBI']]),e('03zMMFkTXk','FACTR 2','runtime')+e('sS9FjkKKsm','LoComposition','runtime')+e('QAHhXvXHtb','YUBI','runtime'))}
 ${summaryTopic('Inference runtimes','<div class="cs-terms"><span>ONNX Runtime</span><span>TensorRT</span><span>TorchScript</span><span>PyTorch</span></div><p>Export → load → select device → warm up → execute.</p>',e('uoFfrJHHq8','AcroRL','runtime')+e('sS9FjkKKsm','LoComposition','runtime')+e('05nE8s5e7I','FlashVLA','runtime'))}
 ${summaryTopic('Resource management',summarySpecs([['GPU execution','CUDA Graph reuse · kernel fusion'],['Runtime allocation','Persistent GPU state · host thread pools'],['Power mode','SOLO: MAXN on Thor']]),e('05nE8s5e7I','FlashVLA','runtime')+e('OckqYiY2QM','EagleVLA','runtime')+e('JWkaXdmqKb','SOLO','hardware'))}
 ${summaryTopic('Scheduling & isolation',summarySpecs([['Kernel','PAKT: PREEMPT_RT'],['Task priorities','FreeRTOS: sensing/control above telemetry'],['CPU affinity / cgroups / SCHED_FIFO','-']]),e('2vDRocNuih','PAKT','runtime')+e('yzejD0WIk9','Task priorities','runtime'))}
 </div>`);
 const communication=summaryChapter('communication','Across process boundaries','Messages, memory and hardware links coexist.',`
 <div class="cs-route" aria-label="Communication boundaries"><div><span>Hardware</span><strong>Sensors & actuators</strong><small>CAN / serial / USB</small></div><span class="cs-arrow" aria-hidden="true">→</span><div><span>On the robot</span><strong>Control processes</strong><small>Shared memory / queues</small></div><span class="cs-arrow" aria-hidden="true">⇄</span><div><span>Across machines</span><strong>Policy server</strong><small>RPC / pub-sub</small></div></div>
 <div class="cs-topic-grid">
 ${summaryTopic('Middleware','<div class="cs-terms"><span>ROS 2 · Humble / Jazzy</span><span>ROS 1 / Noetic</span><span>DDS</span><span>LCM</span></div>',e('03zMMFkTXk','FACTR 2','runtime')+e('PL6UDcy9Eu','FingerViP','runtime')+e('WBGnJHRIso','RoboNaldo','runtime')+e('rK0JCfddwK','Pro-HOI','runtime'))}
 ${summaryTopic('Network IPC',summarySpecs([['Messaging','ZeroMQ REQ/REP · PUB/SUB · Zenoh'],['Request / response','HTTP · WebSocket · gRPC · ZeroRPC'],['Pose streaming','UDP']]),e('8CDEvBQA6x','AutoDex','runtime')+e('xaGVjPTxtr','VISTA','runtime')+e('BxW31Dilgn','MAESTRO','runtime')+e('PL6UDcy9Eu','FingerViP','runtime'))}
 ${summaryTopic('Local IPC','<p>POSIX shared memory, image arrays, queues, locks and events.</p><p>VoLo’s released backend also supports shared files, atomic renames and per-call sequence IDs.</p>',e('2qcSjfv9pr','ADEPT','runtime')+e('sF3YZbbTNX','VoLo','runtime'))}
 ${summaryTopic('Serialization','<div class="cs-terms"><span>MessagePack + NumPy</span><span>JSON</span><span>Protobuf</span><span>Pickle</span></div><p>LeRobot reference code carries pickled observations in protobuf byte messages.</p>',e('c4Z0Y8gvnI','MolmoB0T','runtime')+e('bsjuF5klA3','LeRobot reference','runtime'))}
 ${summaryTopic('Hardware links',summarySpecs([['Arm / hand commands','CAN-FD · TCP'],['Sensor acquisition','I²C → USB serial'],['Shared bus','RS-485 with token passing'],['Host links','Ethernet · Wi-Fi']]),e('ULCeXiRzJD','ProxiDex','runtime')+e('LoGyKMEVVc','RealDexUMI','runtime')+e('XA0dFQQlqP','PanoVine','runtime'))}
 </div>`);
 const timing=summaryChapter('timing','Several clocks, one robot','Capture, inference and control each have their own cadence.',`
 <div class="cs-cadences">
 <div><div class="cs-cadence-title">PAKT ${e('2vDRocNuih','Evidence','runtime')}</div><div class="cs-rate-pair"><div><strong>10 <small>Hz</small></strong><span>Policy commands</span></div><span aria-hidden="true">→</span><div><strong>1 <small>kHz</small></strong><span>Controller loops</span></div></div></div>
 <div><div class="cs-cadence-title">AsyncVLA ${e('JiMWz6U93i','Evidence','runtime')}</div><div class="cs-rate-pair"><div><strong>8 <small>Hz</small></strong><span>Edge adapter</span></div><span aria-hidden="true">⇄</span><div><strong>5 <small>Hz</small></strong><span>Remote base VLA</span></div></div></div>
 <div><div class="cs-cadence-title">FlashVLA ${e('05nE8s5e7I','Evidence','runtime')}</div><div class="cs-rate-pair"><div><strong>67.3 <small>ms</small></strong><span>Inference latency</span></div><span aria-hidden="true">∥</span><div><strong>30 <small>Hz</small></strong><span>Action execution</span></div></div></div>
 </div>
 <div class="cs-topic-grid">
 ${summaryTopic('Timing & concurrency','<p>Inference overlaps execution. Capture timestamps associate remote results with their original observations.</p><p>SSR: 50 Hz inference · 60 Hz depth · 1 kHz communication.</p>',e('JiMWz6U93i','AsyncVLA','runtime')+e('4IT3fcnny2','SSR','runtime'))}
 ${summaryTopic('Action buffering',summarySpecs([['FlashVLA','4 slots · 20-action chunks · execute 16'],['π0.7','Predict 50 · execute 15 or 25'],['Chunk transitions','Retain or align the unexecuted tail']]),e('05nE8s5e7I','FlashVLA','recording')+e('5XKFwWrW0v','π0.7','recording')+e('VY6U0drX88','TBD-VLA','recording'))}
 ${summaryTopic('Freshness & overload',summarySpecs([['Plann3r','Latest snapshots · queue size 1'],['REACT','Drop old observations; reject stale completions'],['Foci Policy recorder','100-image queue; drop frames when full']]),e('RExYYVsLbT','Plann3r','recording')+e('FFB8qNJwV2','REACT','recording')+e('AztNrTzNOf','Foci Policy','recording'))}
 </div>`);
 const operations=summaryChapter('operations','From startup to cleanup','Ownership, readiness and recovery form an explicit lifecycle.',`
 <ol class="cs-lifecycle"><li><span>01</span><strong>Start</strong><small>Launch · connect · claim devices</small></li><li><span>02</span><strong>Prepare</strong><small>Calibrate · warm up · check health</small></li><li><span>03</span><strong>Run</strong><small>Execute · monitor freshness</small></li><li><span>04</span><strong>Recover / stop</strong><small>Hold · retry · drain · release</small></li></ol>
 <div class="cs-topic-grid">
 ${summaryTopic('Process ownership','<p>ROS launch, Docker Compose, tmux, SSH/nohup daemons and managed child processes.</p><p>AutoDex daemons survive trials. EagleVLA’s managed client owns server startup and shutdown.</p>',e('8CDEvBQA6x','AutoDex','lifecycle')+e('OckqYiY2QM','EagleVLA','lifecycle')+e('QAHhXvXHtb','YUBI','lifecycle')+e('RExYYVsLbT','Plann3r','lifecycle'))}
 ${summaryTopic('Readiness',summarySpecs([['Services','Health endpoints · metadata handshake'],['Hardware','First sensor data · calibration · homing'],['Model','Load · GPU warmup'],['Ownership','Reject a competing command publisher']]),e('OckqYiY2QM','EagleVLA','lifecycle')+e('FFB8qNJwV2','REACT','lifecycle')+e('0HS0to0eVo','MPC-Injection','lifecycle'))}
 ${summaryTopic('Fault recovery','<p>Recreate sockets after timeouts; reconnect clients; freeze on stale tracking; retry saves.</p><p>AutoDex escalates invalid CUDA contexts and unsafe held-object recovery to the operator.</p>',e('Q6xWLHyg6x','MolmoAct2','lifecycle')+e('DEPCm83K5I','Tracking safety','lifecycle')+e('8CDEvBQA6x','AutoDex','lifecycle'))}
 ${summaryTopic('Shutdown & supervision',summarySpecs([['GaP framework','Process groups · wait · terminate escalation'],['MAESTRO writer','Drain queues before close'],['systemd evidence','-']]),e('C96z0RnFh8','GaP','lifecycle')+e('BxW31Dilgn','MAESTRO','recording'))}
 </div>`);
 const data=summaryChapter('data','What survives a run','Native artifacts become useful when identity and timing connect them.',`
 <div class="cs-artifact-map"><div class="cs-run"><span>Run / episode identity</span><strong>Manifest</strong><small>Timestamps · configuration · outcome</small></div><div class="cs-artifacts"><div><strong>Media</strong><span>Video · images · depth</span></div><div><strong>Robot streams</strong><span>State · actions · forces</span></div><div><strong>Context</strong><span>Calibration · diagnostics · hashes</span></div></div></div>
 <div class="cs-topic-grid">
 ${summaryTopic('Recording formats','<div class="cs-terms"><span>HDF5</span><span>Zarr</span><span>rosbag2</span><span>NPY / NPZ</span><span>CSV</span><span>JSON / JSONL</span><span>Pickle</span><span>Parquet</span><span>MP4 / AVI</span></div><p>FingerViP: Zarr. YUBI: rosbag2. DexRoam: HDF5 → LeRobot Parquet + video.</p><dl class="cs-specs"><div><dt>MCAP evidence</dt><dd>-</dd></div></dl>',e('PL6UDcy9Eu','FingerViP','recording')+e('QAHhXvXHtb','YUBI','recording')+e('MYYKl10JKD','DexRoam','recording'))}
 ${summaryTopic('Persistence & integrity','<p>Save-on-stop; accept/discard episodes; separate writer processes; queue draining; CSV shards.</p><p>Learning While Deploying reports upload retries, durable notifications and atomic commits.</p>',e('8klpl3FXjN','CSV writer','recording')+e('BxW31Dilgn','Queue draining','recording')+e('656PH9MVla','Durable uploads','lifecycle'))}
 ${summaryTopic('Replay',summarySpecs([['Physical execution','Recorded action trajectories'],['Inspection','rosbag visualization · offline policy evaluation'],['Simulation','Replay hardware trajectories in reconstructed scenes'],['Training scope','Experience replay is a separate use']]),e('QGzgVP8RnK','Robot replay','recording')+e('Mnggg9cnbh','Cyclops','recording')+e('MWj9u2VZPx','RoboSnap','recording'))}
 ${summaryTopic('Provenance',summarySpecs([['Identity','Run / episode IDs · frame indices'],['Time','Capture timestamps · monotonic + UTC clocks'],['Configuration','Calibration · camera serials · checkpoint tags'],['Artifacts','Source paths · SHA-256 references · outcomes']]),e('8CDEvBQA6x','AutoDex','recording')+e('7KV78k8rcv','Cloak','recording')+e('qEOv7MuWIx','Bag conversion','recording'))}
 </div>`);
 return `<div class="corl-summary"><div class="cs-hero"><div><p class="cs-kicker">CoRL 2026 / systems field guide</p><h1>Inside the robot.</h1><p class="cs-deck">Compute, execution and the evidence a run leaves behind.</p></div><a class="cs-open-table" href="?view=practices&cohort=${CORL_SUMMARY_COHORT}">Explore ${records.length} entries <svg class="cs-link-arrow" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 9 9 3M3 3h6v6"/></svg></a></div>
 <div class="cs-chapter-nav" aria-label="Summary chapters">${CORL_SUMMARY_CHAPTERS.map(([id,label],index)=>`<a href="#summary-${id}"><span>0${index+1}</span>${label}</a>`).join('')}</div>
 ${compute}${software}${communication}${timing}${operations}${data}
 <details class="cs-scope"><summary>Evidence scope & open questions</summary><div><p>This guide summarizes the ${records.length} CoRL additions. Examples retain paper, released-code and reference-implementation scope. A dash means the extraction establishes no mechanism for that item.</p><p>RAM, VRAM and model size have different meanings. Resource, recovery, replay and provenance fields contain some training or experimental context. Their nonempty counts require semantic cleanup before quantitative comparison.</p><p>Forty primary-source access gaps and 218 late repository leads remain. Frequency of use, reliability and adoption demand require further evidence.</p><a href="docs/corl-2026.md">Read the review methodology</a></div></details>
 </div>`;
}
