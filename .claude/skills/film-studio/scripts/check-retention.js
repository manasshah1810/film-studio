#!/usr/bin/env node
// Usage:
//   node check-retention.js <work-dir> [--stage script|storyboard|final] [--json]
//   node check-retention.js --selftest
// The retention gate that sits beside the 28 AI tells (references/ai-tells.md section "Retention gate"). Zero
// tokens: run it, do not read it. run-all-checks.js chains it. Rules (R-ids), with the stage they start at:
//   R1 iterations   script      work/script-iterations.md logs all 5 passes of personas/scriptwriter.md section 0
//   R2 hook-question script     the first sentence is a sharp question of 16 words or fewer (never How/Why/What-is)
//   R3 rehook-gap   script      an open-loop re-hook at least every 15 s until the payoff
//   R4 explainer    script      exactly one 5 to 7 s concept micro-explainer, starting in the first 40% of the film
//   R5 pauses       script      [PAUSE 0.6s] to [PAUSE 0.9s] markers before twists: 1 per 30 s of runtime, at least 1
//   R6 metaphor     script      every scene names a concrete, distinct visualMetaphor
//   R7 copy-dup     script      the 2 to 4 word headline never repeats inside a caption chunk
//   R8 orphan-pronoun script    no scene opens on he / she / they / it before any named subject has been spoken
//   R9 runtime-tier script      brief.runtime_tier is set and the script length sits inside it
//   R10 recycle     storyboard  the close never reuses scene 1's graphic (same bespoke id and props, or the same set)
//   R11 full-bleed  storyboard  every scene has a hero (bespoke, widget, card or cast); captions >= 64 px above y 80
const fs = require('fs');
const path = require('path');
const {readJson, args, spoken, pauses} = require('./lib');

const TIERS = {'15-30': [14, 32], '30-45': [28, 48], '60-90': [55, 96], '90-120': [85, 126]};
const REHOOK_MAX = 15, EXPLAIN = [5, 7], PAUSE = [0.6, 0.9], CAPTION_PX = 64;
const OPENER = /^[\s"'([]*(why|how|what\s+is|what's|what\s+are)\b/i;
const PRON = /^(he|she|they|it|his|her|their|them)\b/i;
const ITER_KEYS = [
  [/curiosity/i, /showab/i, /stakes/i, /therefore|but|until/i],
  [/\?/, /re-?hook/i],
  [/micro-?explainer/i, /pronoun/i],
  [/\[PAUSE/i, /drop line|punch/i],
  [/visualMetaphor/i, /audit|critique/i],
];
const words = (s) => spoken(s).split(/\s+/).filter(Boolean);
const first = (s) => spoken(s).split(/(?<=[.!?])\s+/)[0] ?? '';

function check(work, stage = 'final') {
  const J = (n) => path.join(work, n), opt = (n) => (fs.existsSync(J(n)) ? readJson(J(n)) : null);
  const script = opt('script.json'), brief = opt('brief.json'), sb = opt('storyboard.json'), out = [];
  const add = (id, file, problem, fix) => out.push({id, file, problem, fix});
  if (!script) { add('R1 iterations', 'script.json', 'script.json is missing', 'Write it through the 5-pass engine.'); return out; }
  const sc = script.scenes ?? [], total = sc.reduce((a, s) => a + s.duration, 0);
  // R1
  const log = fs.existsSync(J('script-iterations.md')) ? fs.readFileSync(J('script-iterations.md'), 'utf8') : '';
  if (!log) add('R1 iterations', 'script-iterations.md', 'work/script-iterations.md is missing: the script skipped the 5-pass refinement engine', 'Run personas/scriptwriter.md section 0, iterations 1 to 5, and log each one under "## Iteration <n>".');
  else for (let i = 1; i <= 5; i++) {
    const m = log.match(new RegExp(`^##\\s*Iteration\\s*${i}\\b[^\\n]*\\n([\\s\\S]*?)(?=^##\\s*Iteration\\s*\\d|(?![\\s\\S]))`, 'm'));
    if (!m) { add('R1 iterations', 'script-iterations.md', `iteration ${i} is not logged`, `Add "## Iteration ${i}" with its draft and what changed.`); continue; }
    const body = m[1];
    if (body.split(/\n/).filter((l) => l.trim()).length < 3) add('R1 iterations', 'script-iterations.md', `iteration ${i} has fewer than 3 lines of work`, 'Log the draft and the changes, not a heading.');
    for (const k of ITER_KEYS[i - 1]) if (!k.test(body)) add('R1 iterations', 'script-iterations.md', `iteration ${i} does not show its required work (${k.source.replace(/\\/g, '')})`, 'Follow personas/scriptwriter.md section 0 for this pass.');
  }
  // R2
  const hook = first(sc[0]?.narration);
  if (!/\?\s*$/.test(hook)) add('R2 hook-question', 'script.json', `the first sentence "${hook.slice(0, 70)}" is not a question`, 'Rewrite 0-4 s as a sharp question that challenges what the viewer assumes ("Would you wire money to a coin that never existed?").');
  else if (words(hook).length > 16) add('R2 hook-question', 'script.json', `the hook question has ${words(hook).length} words (max 16, it must land in 4 s)`, 'Cut it to 16 words or fewer.');
  if (OPENER.test(hook)) add('R2 hook-question', 'script.json', `the hook opens like a title ("${words(hook).slice(0, 3).join(' ')}...")`, 'Ask a question that challenges a belief; never How / Why / What is.');
  // R3
  const pay = sc.findIndex((s) => s.beat === 'payoff');
  const stops = [0, ...sc.filter((s, i) => s.rehook && (pay < 0 || i <= pay)).map((s) => s.start), pay >= 0 ? sc[pay].start : total];
  for (let i = 1; i < stops.length; i++) if (stops[i] - stops[i - 1] > REHOOK_MAX + 0.5) add('R3 rehook-gap', 'script.json', `${(stops[i] - stops[i - 1]).toFixed(1)} s from ${stops[i - 1].toFixed(1)} s to ${stops[i].toFixed(1)} s with no re-hook (max ${REHOOK_MAX} s)`, 'Mark a scene in that stretch "rehook": true and open it on But / Until / Except with a new open loop.');
  // R4
  const ex = sc.filter((s) => s.explainer);
  if (ex.length !== 1) add('R4 explainer', 'script.json', `${ex.length} scenes are marked "explainer": true; exactly one is needed`, 'Mark the one 5-7 s micro-explainer of the core mechanism.');
  else {
    const e = ex[0], d = e.duration;
    if (d < EXPLAIN[0] - 0.5 || d > EXPLAIN[1] + 1.5) add('R4 explainer', 'script.json', `explainer ${e.id} lasts ${d} s (aim ${EXPLAIN[0]} to ${EXPLAIN[1]} s)`, 'Trim or extend it to one dead-simple, visual beat.');
    if (e.start > total * 0.4) add('R4 explainer', 'script.json', `explainer ${e.id} starts at ${e.start} s, after 40% of the film`, 'Move it into Act 1, before the twist it explains.');
  }
  // R5
  const ps = sc.flatMap((s) => pauses(s.narration).map((p) => ({s: s.id, p})));
  const need = Math.max(1, Math.floor(total / 30));
  if (ps.length < need) add('R5 pauses', 'script.json', `${ps.length} [PAUSE] marker(s) in a ${total.toFixed(0)} s film; needs ${need}`, 'Insert [PAUSE 0.6s] or [PAUSE 0.9s] right before each major twist.');
  for (const x of ps) if (x.p < PAUSE[0] || x.p > PAUSE[1]) add('R5 pauses', 'script.json', `scene ${x.s}: [PAUSE ${x.p}s] is outside ${PAUSE[0]}-${PAUSE[1]} s`, 'Use 0.6 s for a beat, 0.9 s before the biggest twist.');
  // R6
  const seen = new Map();
  for (const s of sc) {
    const v = String(s.visualMetaphor ?? '').trim();
    if (v.length < 12) add('R6 metaphor', 'script.json', `scene ${s.id} has no concrete visualMetaphor`, 'Name the picture: the object, what it does, what it proves.');
    else if (seen.has(v.toLowerCase())) add('R6 metaphor', 'script.json', `scenes ${seen.get(v.toLowerCase())} and ${s.id} share one visualMetaphor`, 'Give every beat its own picture.');
    else seen.set(v.toLowerCase(), s.id);
  }
  // R7
  const norm = (t) => String(t).toLowerCase().replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();
  for (const s of sc) { const h = norm(s.on_screen_text); if (h && (s.captions ?? []).some((c) => norm(c[2]).includes(h))) add('R7 copy-dup', 'script.json', `scene ${s.id}: the headline "${s.on_screen_text}" is repeated inside a caption`, 'The headline names the beat in power words; the caption carries the spoken line. Change one.'); }
  // R8
  let named = false;
  for (const s of sc) {
    const n = spoken(s.narration);
    if (!named && PRON.test(n)) add('R8 orphan-pronoun', 'script.json', `scene ${s.id} opens on "${words(n)[0]}" before any person or thing is named`, 'Name the subject first.');
    if (/\b[A-Z][a-z]+[A-Z]?\w*\b/.test(n.replace(/^\S+/, '')) || /\b[A-Z]{2,}\b/.test(n)) named = true;
  }
  // R9
  const tier = brief?.runtime_tier;
  if (!TIERS[tier]) add('R9 runtime-tier', 'brief.json', `brief.runtime_tier is ${JSON.stringify(tier ?? null)}`, 'Set "30-45", "60-90" or "90-120" from the story (personas/director.md section 2).');
  else if (total < TIERS[tier][0] || total > TIERS[tier][1]) add('R9 runtime-tier', 'script.json', `the script runs ${total.toFixed(1)} s, outside tier ${tier}`, `Fit ${TIERS[tier][0]}-${TIERS[tier][1]} s, or change the tier in the brief.`);
  if (stage === 'script' || !sb) return out;
  // R10
  const scenes = sb.scenes ?? [], firstSc = scenes[0], lastSc = scenes[scenes.length - 1];
  const vis = (s) => (s?.panels ?? []).flatMap((p) => [...(p.bespoke ?? []).map((b) => ({id: b.id, key: `${b.id}|${JSON.stringify(b.props ?? {})}`})), ...(p.widgets ?? []).map((w) => ({id: w.id, key: `${w.id}|${JSON.stringify(w.props ?? {})}`}))]);
  if (firstSc && lastSc && firstSc !== lastSc) {
    const A = vis(firstSc), B = vis(lastSc);
    for (const b of B) if (A.some((x) => x.key === b.key)) add('R10 recycle', 'storyboard.json', `the close (${lastSc.id}) re-shows scene ${firstSc.id}'s "${b.id}" with the same props`, 'Build a unique closing composition: a new bespoke scene, or the old one transformed (new props, new state).');
    const ids = (L) => [...new Set(L.map((x) => x.id))].sort().join(',');
    if (B.length && ids(A) === ids(B)) add('R10 recycle', 'storyboard.json', `the close (${lastSc.id}) uses exactly scene ${firstSc.id}'s set of graphics`, 'Add a closing visual that appears nowhere else.');
  }
  // R11
  const heroOf = (p) => (p.bespoke ?? []).length + (p.widgets ?? []).length + (p.boxes ?? []).filter((b) => ['card', 'widget', 'subject', 'face'].includes(b.kind)).length + (p.asset_ids ?? []).length;
  for (const s of scenes) if (!(s.panels ?? []).some(heroOf)) add('R11 full-bleed', 'storyboard.json', `scene ${s.id} has no hero visual in any panel (only text on the atmosphere)`, 'Give it a bespoke diagram, a widget or a hero card.');
  for (const s of scenes) for (const p of s.panels ?? []) {
    for (const b of (p.boxes ?? []).filter((x) => x.kind === 'caption')) {
      if (b.px && b.px < CAPTION_PX) add('R11 full-bleed', 'storyboard.json', `${p.id} caption box is ${b.px} px (min ${CAPTION_PX})`, `Set px to ${CAPTION_PX} or more.`);
      if (b.y + b.h > 80) add('R11 full-bleed', 'storyboard.json', `${p.id} caption box ends at y ${b.y + b.h} (inside the bottom 20%)`, 'Lift it so y + h <= 80.');
    }
  }
  return out;
}

module.exports = {check};
if (require.main === module) {
  const a = args();
  if (a.selftest) {
    const good = check(path.join(__dirname, 'fixtures', 'pipeline-pass'), 'final');
    const bad = check(path.join(__dirname, 'fixtures', 'tells-fail'), 'final');
    const ids = new Set(bad.map((x) => x.id.split(' ')[0]));
    const miss = ['R1', 'R2', 'R4', 'R5', 'R6', 'R9'].filter((r) => !ids.has(r));
    if (good.length) console.error(`FAIL selftest: the good fixture fails ${good.length} retention rule(s); first: ${JSON.stringify(good[0])}`);
    if (miss.length) console.error(`FAIL selftest: the bad fixture does not trip ${miss.join(', ')}`);
    if (good.length || miss.length) process.exit(1);
    console.log('PASS selftest: retention rules pass on fixtures/pipeline-pass and fire on fixtures/tells-fail');
    process.exit(0);
  }
  if (!a._[0]) { console.error('Usage: node check-retention.js <work-dir> [--stage script|storyboard|final] [--json] | --selftest'); process.exit(2); }
  const stage = ['script', 'storyboard', 'final'].includes(a.stage) ? a.stage : 'final';
  const res = check(a._[0], stage);
  if (a.json) console.log(JSON.stringify({stage, pass: !res.length, items: res}, null, 1));
  else { res.forEach((r) => console.error(`FAIL ${r.id}: ${r.problem}. Fix: ${r.fix}`)); console.log(`${res.length ? 'FAIL' : 'PASS'} retention (${stage}): ${res.length} problem(s)`); }
  process.exit(res.length ? 1 : 0);
}
