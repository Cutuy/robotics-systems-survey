// Validate cited CoRL records and exercise the real renderer against the merged survey.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COHORT = 'corl-2026-full-scan';
const EXPECTED_RECORDS = 571;
const FIELDS = 'compute cpu gpu memory software resources ipc timing lifecycle recovery readiness placement recording buffering replay provenance limitations'.split(' ');
const data = JSON.parse(fs.readFileSync(path.join(root, 'lab-research.json'), 'utf8'));
const records = data.deepSurvey.projects.filter(record => record.cohort === COHORT);
const sources = new Map(data.sources.map(source => [source.id, source]));
const allIds = [...data.deepSurvey.projects, ...data.profiles, ...data.companySurvey.rows.map(row => row.p)].map(record => record.id);
const recordIds = new Set(records.map(record => record.id));

// Arrange / Assert: validate public records and their exact citation scope.
assert.equal(records.length, EXPECTED_RECORDS);
assert.equal(new Set(allIds).size, allIds.length);
assert.equal(sources.size, data.sources.length);
for (const record of records) {
  assert.equal(record.screening.decision, 'include');
  assert(!('followup' in record));
  assert(record.sourceIds.every(id => sources.has(id)));
  for (const source of record.sources) {
    assert.deepEqual(source, sources.get(source.id));
    assert(['https:', 'http:'].includes(new URL(source.url).protocol));
  }
  for (const field of FIELDS) {
    const refs = record.fieldRefs[field];
    assert(refs.every(id => record.sourceIds.includes(id)));
    if (record[field] === '-') {
      assert.equal(refs.length, 0);
      assert.equal(record.fieldEvidence[field], 'missing');
    } else {
      assert(refs.length > 0, `${record.id}.${field} needs a source`);
      assert(['documented', 'reference implementation', 'related lead', 'pending confirmation'].includes(record.fieldEvidence[field]));
    }
  }
}
for (const label of data.practiceLabels) {
  for (const member of label.members.filter(member => recordIds.has(member.id))) {
    assert.equal(member.basis, 'mention');
    assert(member.sources.length > 0 && member.sources.every(id => sources.has(id)));
  }
}
assert.equal(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), fs.readFileSync(path.join(root, 'labs.html'), 'utf8'));

// Arrange: execute the application with inert DOM targets, without a browser dependency.
const nodes = new Map(['#main', '#nav', '#status'].map(key => [key, {innerHTML: '', textContent: '', scrollTop: 0}]));
const location = {search: '?view=practices', href: ''};
const context = vm.createContext({URL, URLSearchParams, console, DATA: data, location,
  history: {replaceState(_state, _title, url) {location.search = url}, pushState() {}},
  document: {addEventListener() {}, querySelector: key => nodes.get(key) ?? null, body: {classList: {remove() {}}, dataset: {}}},
  window: {addEventListener() {}}, fetch: () => new Promise(() => {})});
vm.runInContext(fs.readFileSync(path.join(root, 'corl-summary.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'labs.js'), 'utf8') + '\nreport=DATA;', context);
let checks = 0;
function render(search) {location.search = search; vm.runInContext('render()', context); checks++; return nodes.get('#main').innerHTML}
const rowCount = html => (html.match(/class="workflow-evidence"/g) ?? []).length;
const cohortQuery = `?view=practices&cohort=${COHORT}`;

// Act / Assert: additions remain accessible alongside the existing survey.
assert(rowCount(render('?view=practices')) > EXPECTED_RECORDS);
for (const dimension of ['overview', 'hardware', 'runtime', 'lifecycle', 'recording']) {
  assert.equal(rowCount(render(`${cohortQuery}&dimension=${dimension}`)), EXPECTED_RECORDS);
}
for (const record of records) {
  assert.equal(rowCount(render(`?view=practices&project=${record.id}`)), 1);
  assert(render(`?view=lab-project&project=${record.id}`).includes('Evidence inspected'));
}
for (const label of data.practiceLabels) {
  const members = label.members.filter(member => recordIds.has(member.id));
  if (!members.length) continue;
  const html = render(`${cohortQuery}&dimension=${label.dimension}&labels=${label.id}`);
  assert.equal(rowCount(html), members.length);
  assert(html.includes('source mention'));
}
assert.equal(rowCount(render(`${cohortQuery}&kind=companies`)), 0);
assert.equal((render('?view=sources').match(/<li>/g) ?? []).length, data.sources.length);
for (const population of ['all', 'labs', 'companies']) assert(render(`?view=synthesis&population=${population}`).includes('workflow records'));

// Act / Assert: explicit evidence classes and missing cells survive rendering.
assert.equal(vm.runInContext("surveyCell(deepCell({gpu:'-',fieldEvidence:{gpu:'missing'},fieldRefs:{gpu:[]}},'gpu'))", context), '-');
assert.equal(vm.runInContext("deepCell({ipc:'Reference transport',fieldEvidence:{ipc:'reference implementation'},fieldRefs:{ipc:[]}},'ipc').status", context), 'reference implementation');
assert.equal(vm.runInContext("deepCell({ipc:'Interface only',fieldEvidence:{ipc:'pending confirmation'},fieldRefs:{ipc:[]}},'ipc').status", context), 'pending confirmation');
console.log(`${checks} renderer checks passed; ${records.length} CoRL records and their references validated.`);
