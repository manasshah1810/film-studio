#!/usr/bin/env node
// Usage:
//   node ledger.js estimate <work-dir>                 dry run: planned units per stage against the budget. Writes nothing.
//   node ledger.js init <work-dir> [--approved]        create budget.json from brief.json + library/costs.json
//   node ledger.js spend <work-dir> <stage> <item|units> [count] --note "..."   record a finished action
//   node ledger.js status <work-dir>                   spent / allowance per stage, warnings at 80% and 100%
// Budget units are a planning number, not money or tokens. Only this script edits budget.json.
const fs = require('fs');
const path = require('path');
const {SKILL, readJson, writeJson, frontmatter, args, fail} = require('./lib');

const a = args();
const [cmd, work, stageArg, itemArg, countArg] = a._;
if (!cmd || !work) { console.error('Usage: node ledger.js estimate|init|status <work-dir> | spend <work-dir> <stage> <item|units> [count] --note "..."'); process.exit(2); }
const costs = readJson(path.join(SKILL, 'library', 'costs.json'));
const bp = path.join(work, 'budget.json');
const brief = () => { const p = path.join(work, 'brief.json'); if (!fs.existsSync(p)) fail(`${p} missing`); return readJson(p); };
const r1 = (n) => Math.round(n * 10) / 10;

const plan = (b) => {
  const secs = b.target_seconds;
  if (secs > 300) fail('films over 300 s have no default budget; ask the user for a total (costs.json: over_300_seconds)');
  const bucket = costs.length_buckets.find((x) => secs >= x.seconds[0] && secs <= x.seconds[1]).id;
  const cls = frontmatter(b.style).cost ?? 'medium';
  const mult = costs.style_multiplier[cls];
  const total = costs.total_budget[bucket][cls], reserve = r1((total * costs.reserve_pct) / 100);
  const stages = Object.fromEntries(Object.entries(costs.stage_split_pct_of_total).filter(([k]) => k !== 'reserve').map(([k, pct]) => [k, {allowance: r1((total * pct) / 100), spent: 0}]));
  const u = costs.unit_costs, pf = readJson(path.join(SKILL, 'library', 'platforms.json'))[b.platform];
  const panels = Math.max(3, Math.round(secs / (pf.max_panel_seconds * 0.7))), assets = Math.min(8, 2 + Math.round(secs / 20));
  const chars = Math.round(secs * 14); // about 2.5 words per second, 5.6 characters per word
  // planned actions: 1 review round per stage, a second round assumed for the two stages that most often need it
  const planned = {
    script: [['review_round', 2, 1]],
    cast: [['asset_build', assets, mult], ['still_render', 2, mult], ['review_round', 1, 1]],
    storyboard: [['still_render', 2, mult], ['review_round', 2, 1]],
    vfx: [['still_render', 2, mult], ['review_round', 1, 1]],
    render: [['draft_render_per_second', Math.min(secs, 10), mult], ['final_render_per_second', secs, mult], ...(b.voiceover && !['piper', 'system'].includes(b.voice?.provider) ? [['voice_per_1000_chars', chars / 1000, 1]] : [])],
  };
  const est = Object.fromEntries(Object.entries(planned).map(([k, rows]) => [k, r1(rows.reduce((n, [item, count, m]) => n + u[item].units * count * m, 0))]));
  return {bucket, cls, total, reserve, stages, planned, est, panels, assets};
};

if (cmd === 'estimate') {
  const b = brief(), p = plan(b);
  console.log(`Dry run for "${b.topic}": ${b.target_seconds} s, ${b.style} (${p.cls} cost), ${b.platform}. About ${p.panels} panels, ${p.assets} cast assets.`);
  console.log('stage        planned  allowance');
  let sum = 0, over = [];
  for (const [k, s] of Object.entries(p.stages)) { sum += p.est[k]; if (p.est[k] > s.allowance) over.push(k); console.log(`${k.padEnd(12)} ${String(p.est[k]).padStart(7)}  ${String(s.allowance).padStart(9)}${p.est[k] > s.allowance ? '  OVER' : ''}`); }
  console.log(`total        ${String(r1(sum)).padStart(7)}  ${String(p.total).padStart(9)}  (reserve ${p.reserve}, not planned)`);
  for (const [k, rows] of Object.entries(p.planned)) console.log(`  ${k}: ${rows.map(([i, c]) => `${r1(c)} x ${i}`).join(', ')}`);
  if (over.length || sum > p.total - p.reserve) { console.log(`OVER BUDGET in: ${over.join(', ') || 'total'}. Cut in this order:`); costs.cut_first_order.forEach((c, i) => console.log(`  ${i + 1}. ${c}`)); }
  else console.log('Within budget. Ask the user to approve, then run: ledger.js init <work-dir> --approved');
  process.exit(0);
}
if (cmd === 'init') {
  if (fs.existsSync(bp) && !a.force) fail(`${bp} exists; a budget is set once per run (use --force only after the brief changed)`);
  const b = brief(), p = plan(b);
  writeJson(bp, {total_units: p.total, reserve: p.reserve, bucket: p.bucket, cost_class: p.cls, approved: !!a.approved, stages: p.stages, log: a.approved ? [{stage: 'script', units: 0, note: 'dry-run approved', at: new Date().toISOString()}] : []});
  console.log(`PASS budget ${p.total} units (${p.bucket}, ${p.cls}); reserve ${p.reserve}${a.approved ? '' : '. NOT approved yet: nothing may be built'}`);
  process.exit(0);
}
if (!fs.existsSync(bp)) fail(`${bp} missing; run ledger.js init first`);
const bud = readJson(bp);
const line = (k, s) => { const pct = s.allowance ? s.spent / s.allowance : 0; return `${k.padEnd(12)} ${String(r1(s.spent)).padStart(6)} / ${String(s.allowance).padEnd(6)} ${Math.round(pct * 100)}%${pct >= costs.thresholds.stop_at ? '  STOP: allowance used up, ask the Director' : pct >= costs.thresholds.warn_at ? '  WARN: over 80%' : ''}`; };
if (cmd === 'spend') {
  if (!bud.approved) fail('budget is not approved; show the dry run (ledger.js estimate) and get a yes first');
  const s = bud.stages[stageArg];
  if (!s) fail(`unknown stage "${stageArg}" (${Object.keys(bud.stages).join(', ')})`);
  let units;
  if (costs.unit_costs[itemArg]) units = costs.unit_costs[itemArg].units * Number(countArg ?? 1) * (costs.style_multiplier.applies_to.includes(itemArg) ? costs.style_multiplier[bud.cost_class] : 1);
  else if (!Number.isNaN(Number(itemArg))) units = Number(itemArg);
  else fail(`"${itemArg}" is neither a number nor an item in costs.json (${Object.keys(costs.unit_costs).join(', ')}); never invent a price`);
  if (!a.note) fail('--note is required: say what was done');
  // unspent allowance from earlier stages rolls forward; borrowing from later stages or the reserve does not
  const order = Object.keys(bud.stages), rolled = order.slice(0, order.indexOf(stageArg)).reduce((n, k) => n + Math.max(0, bud.stages[k].allowance - bud.stages[k].spent), 0);
  if (s.spent + units > s.allowance + rolled + 0.001) fail(`stage ${stageArg} would reach ${r1(s.spent + units)} of ${s.allowance} (+${r1(rolled)} rolled forward). Stop and ask the Director; borrowing needs the user's approval`);
  s.spent = r1(s.spent + units);
  bud.log.push({stage: stageArg, units: r1(units), note: String(a.note), at: new Date().toISOString()});
  writeJson(bp, bud);
  console.log(`PASS +${r1(units)} units. ${line(stageArg, s)}`);
  process.exit(0);
}
if (cmd === 'status') {
  for (const [k, s] of Object.entries(bud.stages)) console.log(line(k, s));
  const spent = Object.values(bud.stages).reduce((n, s) => n + s.spent, 0);
  console.log(`total        ${String(r1(spent)).padStart(6)} / ${bud.total_units}  reserve ${bud.reserve} untouched${bud.approved ? '' : '  (NOT approved)'}`);
  process.exit(0);
}
fail(`unknown command "${cmd}"`);
