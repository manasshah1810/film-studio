#!/usr/bin/env node
// Usage:
//   node state.js next <work-dir>                         which stage to run now (this is how a run resumes)
//   node state.js set <work-dir> <stage> <status> [--round n] [--out path] [--note "..."]
//   node state.js show <work-dir>
// Stages run in this order: brief, budget, script, cast, storyboard, vfx, aicheck, render.
// status: pending | running | passed | flagged | failed. "flagged" = round 3 ended under the gate; the
// best version continues and the weak parameters are listed in work/flags.md.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {readJson, writeJson, args, fail} = require('./lib');

const STAGES = ['brief', 'budget', 'script', 'cast', 'storyboard', 'vfx', 'aicheck', 'render'];
const OUT = {brief: 'brief.json', budget: 'budget.json', script: 'script.json', cast: 'cast.json', storyboard: 'storyboard.json', vfx: 'vfx-plan.json', aicheck: 'reviews/aicheck.json', render: 'film.json'};
const a = args();
const [cmd, work, stage, status] = a._;
if (!cmd || !work) { console.error('Usage: node state.js next|show <work-dir> | set <work-dir> <stage> <status> [--round n] [--out path] [--note "..."]'); process.exit(2); }
const sp = path.join(work, 'state.json'), bp = path.join(work, 'brief.json');
// the hash covers what the film depends on; changing the palette alone does not restart the script
const hashOf = () => { if (!fs.existsSync(bp)) return ''; const {design, ...rest} = readJson(bp); return crypto.createHash('sha1').update(JSON.stringify(rest)).digest('hex').slice(0, 12); };
const load = () => (fs.existsSync(sp) ? readJson(sp) : {brief_hash: hashOf(), stages: {}});
const save = (s) => { s.updated = new Date().toISOString(); writeJson(sp, s); };

const st = load();
if (cmd === 'set') {
  if (!STAGES.includes(stage)) fail(`unknown stage "${stage}" (${STAGES.join(', ')})`);
  if (!['pending', 'running', 'passed', 'flagged', 'failed'].includes(status)) fail(`unknown status "${status}"`);
  const prev = st.stages[stage] ?? {round: 0};
  const round = a.round !== undefined ? Number(a.round) : prev.round;
  if (round > 3) fail('a stage gets 3 review rounds at most; set it to flagged and list the weak parameters in work/flags.md');
  const out = a.out ?? prev.output_path ?? path.join(work, OUT[stage]).replace(/\\/g, '/');
  if (['passed', 'flagged'].includes(status) && !fs.existsSync(path.resolve(out))) fail(`${out} does not exist; a stage cannot pass without its output file`);
  st.stages[stage] = {status, round, output_path: out, ...(a.note ? {note: String(a.note)} : {})};
  if (stage === 'brief') st.brief_hash = hashOf();
  save(st);
  console.log(`PASS ${stage}: ${status} (round ${round})`);
} else if (cmd === 'next' || cmd === 'show') {
  const h = hashOf();
  if (st.brief_hash && h && st.brief_hash !== h) {
    // the brief changed: everything built from it is stale
    for (const k of STAGES.slice(1)) if (st.stages[k]) st.stages[k] = {...st.stages[k], status: 'pending', round: 0, note: 'brief changed'};
    st.brief_hash = h; save(st);
    console.log('NOTE brief.json changed since the last run; later stages were reset to pending.');
  }
  if (cmd === 'show') { for (const k of STAGES) { const s = st.stages[k]; console.log(`${k.padEnd(11)} ${(s?.status ?? 'pending').padEnd(8)} round ${s?.round ?? 0}${s?.note ? '  ' + s.note : ''}`); } process.exit(0); }
  for (const k of STAGES) {
    const s = st.stages[k];
    if (s?.status === 'failed') { console.log(`STOP ${k} failed${s.note ? ': ' + s.note : ''}. Report it to the user; do not retry in a loop.`); process.exit(1); }
    if (!s || !['passed', 'flagged'].includes(s.status)) { console.log(`NEXT ${k}${s?.status === 'running' ? ` (was running, round ${s.round}: redo this stage from its inputs)` : ''}`); process.exit(0); }
    if (!fs.existsSync(path.resolve(s.output_path))) { console.log(`NEXT ${k} (marked ${s.status} but ${s.output_path} is gone)`); process.exit(0); }
  }
  console.log('DONE all stages passed or flagged.');
} else fail(`unknown command "${cmd}"`);
