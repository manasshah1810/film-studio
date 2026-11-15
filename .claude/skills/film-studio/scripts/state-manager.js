#!/usr/bin/env node
// Usage:
//   node state-manager.js next <work-dir>                         the ONE stage to run now, its manual, inputs, output and gate
//   node state-manager.js set <work-dir> <stage> <status> [--round n] [--out path] [--note "..."]
//   node state-manager.js show <work-dir>                         every stage and its status
// work/state.json records the last completed persona stage, so an interrupted session resumes from there
// instead of restarting. status: pending | running | passed | flagged | failed. "flagged" = round 3 ended
// under the review gate; the best version continues and the weak parameters are in work/flags.md.
// The stage table below is the routing in references/director-cheatsheet.md; keep the two in step.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {readJson, writeJson, args, fail} = require('./lib');

/** [stage, persona, the one manual to open, inputs from work/, output, gate command(s)] */
const PIPE = [
  ['director', 'Director', 'personas/director.md', '-', 'brief.json', 'node scripts/pick-design.js work && node scripts/validate-schema.js --work work'],
  ['treasurer', 'Treasurer', 'roles/treasurer.md', 'brief.json', 'budget.json', 'node scripts/ledger.js estimate work, then the user says yes'],
  ['angles', 'Scriptwriter (angle mining)', 'personas/scriptwriter.md section 0', 'brief.json', 'angles.json', 'node scripts/validate-schema.js --work work'],
  ['iterations', 'Scriptwriter (5-pass refinement engine)', 'personas/scriptwriter.md section 0', 'brief.json, angles.json', 'script-iterations.md', 'node scripts/check-retention.js work --stage script (R1 must pass; later rules pass at the next stage)'],
  ['scriptwriter', 'Scriptwriter (lock Iteration 5)', 'personas/scriptwriter.md', 'brief.json, angles.json, script-iterations.md', 'script.json', 'node scripts/run-all-checks.js work --stage script'],
  ['casting', 'Selector, then Casting and Rig Designer', 'roles/selector.md, then personas/casting-rig-designer.md', 'script.json, brief.json', 'cast.json', 'node scripts/validate-schema.js --work work'],
  ['art-director', 'Art Director', 'personas/art-director.md + styles/<style>/style.md', 'script.json, cast.json', 'storyboard.json', 'node scripts/run-all-checks.js work --stage storyboard'],
  ['widget-integrator', 'Widget Integrator (+ bespoke scenes in components/bespoke/)', 'personas/widget-integrator.md', 'script.json, storyboard.json', 'widgets.json', 'node scripts/run-all-checks.js work --stage storyboard'],
  ['motion-choreographer', 'Motion Choreographer', 'personas/motion-choreographer.md', 'script.json, storyboard.json', 'motion.json', 'node scripts/run-all-checks.js work --stage storyboard'],
  ['vfx-director', 'VFX Director', 'roles/vfx-director.md', 'storyboard.json, brief.json', 'vfx-plan.json', 'node scripts/validate-schema.js --work work'],
  ['sound-designer', 'Sound Designer', 'personas/sound-designer.md', 'storyboard.json, motion.json, widgets.json', 'audio-cues.json', 'node scripts/build-film.js work'],
  ['checks', 'scripts only', 'nothing', 'all of work/', 'reviews/checks.json', 'node scripts/build-film.js work && node scripts/run-all-checks.js work'],
  ['pass1', 'Renderer (Pass 1)', 'roles/renderer.md', 'render-manifest.json', 'out/pass1.mp4', 'node scripts/render.js work --pass 1 && node scripts/check-render.js work --pass 1'],
  ['qa-inspector', 'QA Inspector', 'personas/qa-inspector.md', 'work/, out/pass1.mp4, stills', 'reviews/qa-audit.json', 'fix every defect at its owner, then node scripts/run-all-checks.js work'],
  ['pass2', 'Renderer (Pass 2 polish)', 'roles/renderer.md', 'render-manifest.json', 'out/final.mp4', 'node scripts/render.js work --pass 2 && node scripts/check-render.js work --pass 2'],
];
const STAGES = PIPE.map((p) => p[0]);
const a = args();
const [cmd, work, stage, status] = a._;
if (!cmd || !work) { console.error('Usage: node state-manager.js next|show <work-dir> | set <work-dir> <stage> <status> [--round n] [--out path] [--note "..."]'); process.exit(2); }
const sp = path.join(work, 'state.json'), bp = path.join(work, 'brief.json');
// the hash covers what the film depends on; changing the palette alone does not restart the script
const hashOf = () => { if (!fs.existsSync(bp)) return ''; const {design, ...rest} = readJson(bp); return crypto.createHash('sha1').update(JSON.stringify(rest)).digest('hex').slice(0, 12); };
const load = () => (fs.existsSync(sp) ? readJson(sp) : {brief_hash: hashOf(), stages: {}});
const save = (s) => { s.updated = new Date().toISOString(); writeJson(sp, s); };
const route = (k) => { const [, who, manual, inputs, out, gate] = PIPE.find((p) => p[0] === k); return `  persona: ${who}\n  read:    ${manual} (only this)\n  inputs:  ${inputs}\n  write:   work/${out}\n  gate:    ${gate}`; };

const st = load();
for (const k of Object.keys(st.stages)) if (!STAGES.includes(k)) delete st.stages[k]; // a pre-persona state file: unknown stages are dropped
if (cmd === 'set') {
  if (!STAGES.includes(stage)) fail(`unknown stage "${stage}" (${STAGES.join(', ')})`);
  if (!['pending', 'running', 'passed', 'flagged', 'failed'].includes(status)) fail(`unknown status "${status}"`);
  const prev = st.stages[stage] ?? {round: 0};
  const round = a.round !== undefined ? Number(a.round) : prev.round;
  if (round > 3) fail('a stage gets 3 review rounds at most; set it to flagged and list the weak parameters in work/flags.md');
  const out = a.out ?? prev.output_path ?? path.join(work, PIPE.find((p) => p[0] === stage)[4]).replace(/\\/g, '/');
  if (['passed', 'flagged'].includes(status) && !fs.existsSync(path.resolve(out))) fail(`${out} does not exist; a stage cannot pass without its output file`);
  st.stages[stage] = {status, round, output_path: out, ...(a.note ? {note: String(a.note)} : {})};
  if (stage === 'director') st.brief_hash = hashOf();
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
  if (cmd === 'show') { for (const k of STAGES) { const s = st.stages[k]; console.log(`${k.padEnd(21)} ${(s?.status ?? 'pending').padEnd(8)} round ${s?.round ?? 0}${s?.note ? '  ' + s.note : ''}`); } process.exit(0); }
  let last = null;
  for (const k of STAGES) {
    const s = st.stages[k];
    if (s?.status === 'failed') { console.log(`STOP ${k} failed${s.note ? ': ' + s.note : ''}. Report it to the user; do not retry in a loop.`); process.exit(1); }
    if (!s || !['passed', 'flagged'].includes(s.status)) { console.log(`NEXT ${k}${s?.status === 'running' ? ` (was running, round ${s.round}: redo this stage from its inputs)` : ''}${last ? ` (last completed: ${last})` : ''}\n${route(k)}`); process.exit(0); }
    if (!fs.existsSync(path.resolve(s.output_path))) { console.log(`NEXT ${k} (marked ${s.status} but ${s.output_path} is gone)\n${route(k)}`); process.exit(0); }
    last = k;
  }
  console.log('DONE all stages passed or flagged. Present work/out/final.mp4 with the finish report.');
} else fail(`unknown command "${cmd}"`);

