#!/usr/bin/env node
// Usage:
//   node run-all-checks.js <work-dir | work/render-manifest.json> [--stage script|storyboard|final]   the whole gate in one command
//   node run-all-checks.js --selftest                                     prove the gate passes the good fixture and catches planted violations
// Chains, in order: validate-schema.js (schemas + cross-file rules, render-manifest.json when present),
// check-design.js (closed palette and fonts, WCAG AA 4.5:1 body / 3.0:1 display), check-safezones.js
// (9:16 bottom 20% and right 15%), check-ai-tells.js (the 28 rules), check-retention.js (R1-R11: the 5-pass
// script log in work/script-iterations.md, hook, re-hooks, pauses, metaphors, tier, recycling). Stage "script" runs only what a
// script can fail. Zero tokens: run it, do not read it.
// Exit 0: one PASS line, and work/reviews/checks.json says pass. Exit 1: one JSON object per line on stdout,
//   {"check", "file", "item", "problem", "fix"}, the same list in work/reviews/checks.json. Fix each line at its
//   file and run again. Never loop on the same failure more than twice: stop and report.
const fs = require('fs');
const os = require('os');
const path = require('path');
const {spawnSync} = require('child_process');
const {args} = require('./lib');

const HERE = __dirname;
const run = (script, argv) => {
  const r = spawnSync(process.execPath, [path.join(HERE, script), ...argv], {encoding: 'utf8'});
  return {code: r.status, out: `${r.stdout ?? ''}\n${r.stderr ?? ''}`};
};
const SCRIPT_RULES = new Set(['opener', 'buzzwords', 'cadence', 'causal', 'placeholder', 'verify', 'shallow-script']);
const itemOf = (s) => (s.match(/\bs\d+p\d+\b/) ?? s.match(/\bscene s\d+\b/) ?? s.match(/\bsfx [a-z0-9-]+ at \d+\b/) ?? s.match(/\bcast [a-z0-9-]+\b/) ?? [''])[0];
const split = (msg) => { const i = msg.search(/\.?\s*Fix: /); return i < 0 ? [msg.trim(), ''] : [msg.slice(0, i).trim(), msg.slice(i).replace(/^\.?\s*Fix:\s*/, '').trim()]; };
const fileFor = (s, fallback) => (/widget/.test(s) && fs.existsSync(path.join(cur.work, 'widgets.json')) ? 'widgets.json' : fallback);
let cur = {work: ''};

function gate(work, stage) {
  cur = {work};
  const items = [], ran = [];
  const add = (check, file, msg) => { const [problem, fix] = split(msg); items.push({check, file, item: itemOf(msg), problem, fix: fix || 'Change the value so the rule holds, then run again.'}); };

  // 1. schemas and cross-file rules
  const v = run('validate-schema.js', ['--work', work]);
  ran.push('validate-schema');
  let label = '';
  for (const line of v.out.split(/\r?\n/)) {
    const h = line.match(/^(PASS|FAIL) (.+)$/);
    if (h) { label = h[2].trim(); continue; }
    const m = line.match(/^ {2}- (.+)$/);
    if (m && !m[1].startsWith('WARN') && v.code !== 0 && label) add('validate-schema', label.endsWith('.json') ? label : `${label}.json`, m[1]);
  }
  if (v.code !== 0 && !items.length) add('validate-schema', '-', v.out.trim().split(/\r?\n/).pop());
  const manifest = path.join(work, 'render-manifest.json');
  if (stage === 'final' && fs.existsSync(manifest)) {
    const r = run('validate-schema.js', ['render-manifest', manifest]);
    ran.push('validate-schema render-manifest');
    for (const line of r.out.split(/\r?\n/)) { const m = line.match(/^ {2}- (.+)$/); if (m && !m[1].startsWith('WARN') && r.code !== 0) add('validate-schema', 'render-manifest.json', m[1]); }
  }
  // 2-3. design lock + contrast, safe zones (need a storyboard)
  if (stage !== 'script' && fs.existsSync(path.join(work, 'storyboard.json'))) {
    for (const [name, file] of [['check-design.js', 'storyboard.json'], ['check-safezones.js', 'storyboard.json']]) {
      const r = run(name, [work]);
      ran.push(name.replace('.js', ''));
      for (const line of r.out.split(/\r?\n/)) { const m = line.match(/^FAIL (.+)$/); if (m) add(name.replace('.js', ''), fileFor(m[1], file), m[1]); }
      if (r.code !== 0 && !r.out.includes('FAIL ')) add(name.replace('.js', ''), file, r.out.trim().split(/\r?\n/).pop());
    }
  }
  // 4. the 28 AI tells
  const t = run('check-ai-tells.js', [work, '--stage', stage, '--json']);
  ran.push('check-ai-tells');
  try {
    const j = JSON.parse(t.out.slice(t.out.indexOf('{'), t.out.lastIndexOf('}') + 1));
    for (const rule of j.rules.filter((x) => !x.pass)) for (const e of rule.errs) add(`check-ai-tells #${String(rule.n).padStart(2, '0')} ${rule.id}`, fileFor(e, SCRIPT_RULES.has(rule.id) ? 'script.json' : 'storyboard.json'), e);
  } catch (e) { add('check-ai-tells', '-', `could not read its report: ${t.out.trim().split(/\r?\n/).slice(-1)[0]}`); }
  // 5. the retention gate beside the tells (5-pass script log, question hook, re-hooks, explainer, pauses,
  // visual metaphors, runtime tier, no recycled closing frame, full-bleed heroes)
  ran.push('check-retention');
  for (const x of require('./check-retention').check(work, stage)) add(`check-retention ${x.id}`, x.file, `${x.problem}. Fix: ${x.fix}`);
  return {pass: !items.length, stage, ran, items};
}

const a = args();
if (a.selftest) {
  // copy the good fixture, plant one violation per gate, and demand each is caught by the right check
  const fx = path.join(HERE, 'fixtures', 'pipeline-pass');
  const good = gate(fx, 'final');
  const plant = [
    ['"Why X..." hook', 'check-ai-tells #01 opener', (d) => { const s = JSON.parse(fs.readFileSync(path.join(d, 'script.json'))); s.scenes[0].narration = 'Why do small plans beat discipline? ' + s.scenes[0].narration; fs.writeFileSync(path.join(d, 'script.json'), JSON.stringify(s)); }],
    ['static hold over 3.5 s', 'check-ai-tells #03 static-hold', (d) => { const s = JSON.parse(fs.readFileSync(path.join(d, 'storyboard.json'))); const p = s.scenes[1].panels[0]; p.duration += 3; p.beats = []; p.sfx = []; p.widgets = []; s.scenes[1].panels[1].duration -= 3; for (const f of ['widgets.json', 'motion.json', 'audio-cues.json']) fs.rmSync(path.join(d, f), {force: true}); fs.writeFileSync(path.join(d, 'storyboard.json'), JSON.stringify(s)); }],
    ['low-contrast text', 'check-design', (d) => { const s = JSON.parse(fs.readFileSync(path.join(d, 'storyboard.json'))); const b = s.scenes.flatMap((x) => x.panels).flatMap((p) => p.boxes ?? []).find((x) => x.kind === 'text' && x.role === 'body'); b.color = 'surface'; fs.writeFileSync(path.join(d, 'storyboard.json'), JSON.stringify(s)); }],
    ['caption in the bottom 20%', 'check-safezones', (d) => { const s = JSON.parse(fs.readFileSync(path.join(d, 'storyboard.json'))); const b = s.scenes[0].panels[0].boxes.find((x) => x.kind === 'caption'); b.y = 84; fs.writeFileSync(path.join(d, 'storyboard.json'), JSON.stringify(s)); }],
  ];
  let bad = 0;
  if (!good.pass) { bad++; console.error(`FAIL selftest: the good fixture fails ${good.items.length} check(s); first: ${JSON.stringify(good.items[0])}`); }
  else console.log(`PASS selftest: fixtures/pipeline-pass passes ${good.ran.join(', ')}`);
  for (const [name, want, mutate] of plant) {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-gate-'));
    for (const f of fs.readdirSync(fx)) if (f.endsWith('.json')) fs.copyFileSync(path.join(fx, f), path.join(d, f));
    mutate(d);
    const r = gate(d, 'final');
    const hit = r.items.find((x) => x.check.startsWith(want));
    if (!hit) { bad++; console.error(`FAIL selftest: planted ${name} was not caught by ${want} (got: ${r.items.map((x) => x.check).join(', ') || 'nothing'})`); }
    else console.log(`PASS selftest: planted ${name} -> ${JSON.stringify(hit)}`);
    fs.rmSync(d, {recursive: true, force: true});
  }
  process.exit(bad ? 1 : 0);
}
// a render-manifest.json (or any file in the work folder) stands for its folder
const work = a._[0] && fs.existsSync(a._[0]) && fs.statSync(a._[0]).isFile() ? path.dirname(a._[0]) : a._[0];
if (!work) { console.error('Usage: node run-all-checks.js <work-dir> [--stage script|storyboard|final] | --selftest'); process.exit(2); }
const stage = ['script', 'storyboard', 'final'].includes(a.stage) ? a.stage : 'final';
const res = gate(work, stage);
const out = path.join(work, 'reviews', 'checks.json');
fs.mkdirSync(path.dirname(out), {recursive: true});
fs.writeFileSync(out, JSON.stringify(res, null, 1) + '\n');
if (res.pass) { console.log(`PASS all checks (${stage}): ${res.ran.join(', ')}. Report: ${out.replace(/\\/g, '/')}`); process.exit(0); }
for (const it of res.items) console.log(JSON.stringify(it));
console.error(`FAIL ${res.items.length} item(s) at stage ${stage}. Fix each at its file, then run again. Report: ${out.replace(/\\/g, '/')}`);
process.exit(1);
