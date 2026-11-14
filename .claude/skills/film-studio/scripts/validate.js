#!/usr/bin/env node
// Usage:
//   node validate.js <schema-name> <file>     one file (siblings in the same folder are used for cross-checks)
//   node validate.js --work <dir>             every known file in a work folder
//   node validate.js --examples               the example run in schema/
// Schema check first (ajv), then the rules a schema cannot express. Exit 1 on any FAIL. WARN never fails.
const fs = require('fs');
const path = require('path');
const {SKILL, creq, readJson, loadDS, listStyles, frontmatter, args} = require('./lib');

const SCHEMA_DIR = path.join(SKILL, 'schema');
const BUCKETS = {'15-30s': [15, 30], '30-1m': [30, 60], '1-5m': [60, 300], '5-10m': [300, 600], '10m+': [600, Infinity]};
const NAMES = ['brief', 'budget', 'script', 'needs', 'cast', 'storyboard', 'vfx-plan', 'credits', 'state'];
const Ajv = creq('ajv/dist/2020');
const ajv = new Ajv({allErrors: true, strict: false});
const words = (s) => String(s ?? '').trim().split(/\s+/).filter(Boolean).length;
const sum = (a) => Math.round(a.reduce((x, y) => x + y, 0) * 1000) / 1000;

const effects = () => {
  const dir = path.join(SKILL, 'library', 'vfx'), m = new Map();
  for (const f of fs.readdirSync(dir)) if (f.endsWith('.json') && f !== 'style-rules.json') for (const e of readJson(path.join(dir, f)).entries) m.set(e.id, e);
  return {lib: m, rules: readJson(path.join(dir, 'style-rules.json'))};
};
const propBases = () => [...fs.readFileSync(path.join(SKILL, 'components', 'engine', 'props.ts'), 'utf8').matchAll(/^\t'?([a-z][a-z-]*)'?: \[/gm)].map((m) => m[1]);
const platforms = () => readJson(path.join(SKILL, 'library', 'platforms.json'));
const platformOf = (brief) => platforms()[brief.platform === 'youtube' && ['15-30s', '30-1m'].includes(brief.length_bucket) ? 'youtube-shorts' : brief.platform];

/** Text a viewer has to read on one panel (captions excluded). */
const panelText = (s) => [s.kicker, s.headline, s.sub, s.stat && `${s.stat.value} ${s.stat.label ?? ''}`, s.quote?.text, ...(s.items ?? []), ...(s.points ?? []).map((p) => `${p.when} ${p.what}`), ...(s.sides ?? []).map((x) => `${x.label} ${x.value ?? ''}`), ...(s.cast ?? []).map((c) => c.says)].filter(Boolean).join(' ');
const NEEDS = {title: ['headline'], stat: ['stat'], figure: ['cast'], versus: ['sides'], chart: ['chart'], object: ['prop'], quote: ['quote'], timeline: ['points'], list: ['items']};

// Each check gets (data, ctx) where ctx.get(name) returns a sibling file or null. Pushes to E (errors) and W (warnings).
const semantic = {
  brief(d, ctx, E, W) {
    if (!listStyles().length) return W.push(`style "${d.style}": no style is built yet, so the design cannot be checked`);
    if (!listStyles().includes(d.style)) return E.push(`style "${d.style}" has no design system (have: ${listStyles().join(', ')})`);
    const fm = frontmatter(d.style);
    if (!['none', 'web'].includes(fm.requires)) E.push(`style "${d.style}" has requires: ${fm.requires ?? 'missing'}; only none or web may be offered`);
    if (fm.status !== 'verified') W.push(`style "${d.style}" status is ${fm.status ?? 'missing'}, not verified`);
    const ds = loadDS(d.style);
    if (!ds.palettes.some((p) => p.id === d.design.palette_id)) E.push(`design.palette_id "${d.design.palette_id}" is not in styles/${d.style}/design-system.json (run pick-design.js)`);
    if (!ds.fonts.some((p) => p.id === d.design.pairing_id)) E.push(`design.pairing_id "${d.design.pairing_id}" is not in styles/${d.style}/design-system.json (run pick-design.js)`);
    const pal = ds.palettes.find((p) => p.id === d.design.palette_id);
    if (pal && d.design.palette_tier && pal.tier !== d.design.palette_tier) E.push(`design.palette_tier is ${d.design.palette_tier} but palette "${pal.id}" is ${pal.tier} (re-run pick-design.js)`);
    if (d.subject_mode && ds.subject_mode && d.subject_mode !== ds.subject_mode) E.push(`subject_mode is ${d.subject_mode} but styles/${d.style} is ${ds.subject_mode}`);
    const [lo, hi] = BUCKETS[d.length_bucket];
    if (d.target_seconds < lo || d.target_seconds > hi) E.push(`target_seconds ${d.target_seconds} is outside bucket ${d.length_bucket}`);
    if (/(sk-|api[_-]?key\s*[:=]|xi-api-key|Bearer\s+[A-Za-z0-9])/i.test(JSON.stringify(d))) E.push('brief looks like it contains a secret; keys live in the environment only');
  },
  script(d, ctx, E, W) {
    const brief = ctx.get('brief');
    let at = 0;
    for (const s of d.scenes) {
      if (Math.abs(s.start - at) > 0.01) E.push(`scene ${s.id}: start ${s.start} but previous scenes end at ${at}`);
      at = sum([at, s.duration]);
      // every figure a viewer hears or reads must be backed by a fact entry in the same scene
      const claims = s.facts.map((f) => f.claim).join(' ');
      for (const n of new Set(`${s.narration} ${s.on_screen_text}`.match(/\d[\d,.]*%?/g) ?? [])) if (!claims.includes(n.replace(/[.,]$/, ''))) E.push(`scene ${s.id}: number "${n}" is not in any fact claim for that scene (no invented facts)`);
      for (const f of s.facts) {
        if (f.status === 'verified' && !/^https?:\/\/|\(\d{4}\)|\d{4}/.test(f.source)) E.push(`scene ${s.id}: fact marked verified has no source: "${f.claim.slice(0, 50)}"`);
        if (f.status === 'VERIFY') W.push(`scene ${s.id}: [VERIFY: ${f.claim.slice(0, 70)}]`);
      }
      if (words(s.narration) / s.duration > 3.2) W.push(`scene ${s.id}: ${(words(s.narration) / s.duration).toFixed(1)} words per second is too fast to speak (aim for 2.3-2.8)`);
    }
    // retention: a hook or re-hook at least every 10 s until the payoff; re-hooks open on a turn word
    const stop = d.scenes.find((s) => ['payoff', 'close'].includes(s.beat))?.start ?? at;
    const marks = [...d.scenes.filter((s, i) => (i === 0 || s.rehook) && s.start < stop).map((s) => s.start), stop];
    for (let i = 1; i < marks.length; i++) if (marks[i] - marks[i - 1] > 10) E.push(`no re-hook between ${marks[i - 1]} s and ${marks[i]} s (max 10 s). Fix: set "rehook": true on a scene that starts inside that gap and open it with But, Yet, Until or Except plus a new question.`);
    for (const s of d.scenes.filter((x) => x.rehook)) if (!/^["'\s]*(but|yet|until|except|instead|so|then|and yet|only)\b/i.test(s.narration)) E.push(`scene ${s.id}: a re-hook must open on a turn word. Fix: start the narration with But, Yet, Until, Except or Instead.`);
    if (!d.hook) W.push('script has no "hook" object (formula, belief, gap); the Storyboard needs it for the first 3 seconds');
    // frame-timed caption chunks
    const fps = d.fps ?? 30, norm = (x) => String(x).replace(/\s+/g, ' ').trim();
    for (const s of d.scenes) {
      if (!s.captions) { W.push(`scene ${s.id}: no frame-timed captions`); continue; }
      const f0 = Math.round(s.start * fps), f1 = Math.round((s.start + s.duration) * fps);
      let prev = f0;
      for (const [from, to, text, power] of s.captions) {
        const T = `scene ${s.id} caption "${text}"`;
        if (words(text) > 5) E.push(`${T}: ${words(text)} words (max 5). Fix: split it into two chunks.`);
        if (from < prev || to <= from || to > f1) E.push(`${T}: frames ${from}-${to} must be in order inside the scene (${f0}-${f1}) and start at or after ${prev}`);
        if (power && !norm(text).toLowerCase().split(' ').map((w) => w.replace(/[^a-z0-9']/g, '')).includes(power.toLowerCase())) E.push(`${T}: power word "${power}" is not a word in the chunk`);
        prev = to;
      }
      if (norm(s.captions.map((c) => c[2]).join(' ')) !== norm(s.narration)) E.push(`scene ${s.id}: the caption chunks joined do not equal the narration. Fix: chunk the narration word for word.`);
      if (!s.captions.some((c) => c[3])) E.push(`scene ${s.id}: no power word. Fix: add a 4th item to one chunk, the single word to bold.`);
    }
    if (!brief) return W.push('SKIP length checks: no brief next to file');
    const [lo, hi] = BUCKETS[brief.length_bucket];
    if (at < lo || at > hi) E.push(`script runs ${at} s, outside bucket ${brief.length_bucket}`);
    if (Math.abs(at - brief.target_seconds) > brief.target_seconds * 0.1) E.push(`script runs ${at} s; target is ${brief.target_seconds} s (allowed: 10% either way)`);
  },
  needs(d, ctx, E) {
    const script = ctx.get('script'), ids = new Set(script?.scenes.map((s) => s.id));
    const seen = new Set();
    for (const n of d.items) {
      if (seen.has(n.id)) E.push(`duplicate need id "${n.id}"`);
      seen.add(n.id);
      if (script) for (const s of n.scenes_used) if (!ids.has(s)) E.push(`need ${n.id}: scene "${s}" is not in the script`);
      if (n.reuse && !propBases().includes(n.reuse)) E.push(`need ${n.id}: reuse "${n.reuse}" is not a built-in prop`);
    }
  },
  cast(d, ctx, E, W) {
    const needs = ctx.get('needs'), credits = ctx.get('credits'), bases = propBases(), seen = new Set();
    for (const a of d.assets) {
      if (seen.has(a.id)) E.push(`duplicate cast id "${a.id}"`);
      seen.add(a.id);
      if (a.def.kind === 'prop' && a.def.base && !bases.includes(a.def.base)) E.push(`cast ${a.id}: prop base "${a.def.base}" does not exist (have: ${bases.join(', ')})`);
      if (a.def.kind === 'media' && !(credits?.items ?? []).some((c) => c.asset_id === a.id)) E.push(`cast ${a.id}: media has no entry in credits.json (unlicensed assets are rejected)`);
      if (!a.approved) W.push(`cast ${a.id}: not approved yet; it will not render`);
    }
    if (needs) for (const n of needs.items) if (!d.assets.some((a) => (a.need_id ?? a.id) === n.id)) W.push(`need "${n.id}" has no cast asset`);
    const chars = d.assets.filter((a) => a.def.kind === 'character');
    for (const a of chars) for (const b of chars) if (a.id < b.id && ['color', 'hair', 'build', 'accessory'].every((k) => (a.def[k] ?? '') === (b.def[k] ?? ''))) E.push(`cast ${a.id} and ${b.id} are identical; characters must differ in colour, hair, build or accessory`);
  },
  storyboard(d, ctx, E, W) {
    const script = ctx.get('script'), cast = ctx.get('cast'), brief = ctx.get('brief');
    const approved = new Map((cast?.assets ?? []).map((a) => [a.id, a]));
    const ds = brief && listStyles().includes(brief.style) ? loadDS(brief.style) : null;
    const pf = brief ? platformOf(brief) : null;
    const minSec = ds ? ds.motion.enter_frames / ds.motion.fps : 0, goodSec = ds ? (ds.motion.enter_frames + ds.motion.min_hold_frames) / ds.motion.fps : 0;
    const ids = new Set();
    let first = true, shown = 0, onStyle = 0;
    if (script) for (const s of script.scenes) if (!d.scenes.some((x) => x.id === s.id)) E.push(`scene ${s.id} from the script has no panels`);
    for (const sc of d.scenes) {
      const ss = script?.scenes.find((s) => s.id === sc.id);
      if (script && !ss) E.push(`scene ${sc.id} is not in the script`);
      const total = sum(sc.panels.map((p) => p.duration));
      if (ss && Math.abs(total - ss.duration) > 0.05) E.push(`scene ${sc.id}: panels total ${total} s, script says ${ss.duration} s`);
      if (sc.panels.filter((p) => p.energy === 'peak').length > 1) E.push(`scene ${sc.id}: more than one peak panel`);
      for (const p of sc.panels) {
        const s = p.slots, T = `panel ${p.id}:`;
        if (ids.has(p.id)) E.push(`${T} duplicate id`);
        ids.add(p.id);
        if (!p.id.startsWith(sc.id + 'p')) E.push(`${T} id must start with ${sc.id}p`);
        for (const k of NEEDS[p.layout]) if (!s[k]) E.push(`${T} layout ${p.layout} needs slots.${k}`);
        const used = [...(s.cast ?? []).map((c) => c.id), s.prop?.id, s.media, ...(s.sides ?? []).flatMap((x) => [x.prop, x.cast])].filter(Boolean);
        for (const id of used) if (!p.asset_ids.includes(id)) E.push(`${T} slot uses "${id}" but asset_ids does not list it`);
        if (cast) for (const id of p.asset_ids) {
          if (!approved.has(id)) E.push(`${T} asset "${id}" is not in cast.json`);
          else if (!approved.get(id).approved) E.push(`${T} asset "${id}" is not approved`);
        }
        if (s.emphasis && !`${s.headline ?? ''} ${s.quote?.text ?? ''}`.toLowerCase().includes(s.emphasis.toLowerCase())) E.push(`${T} emphasis "${s.emphasis}" does not appear in the headline`);
        if (s.chart) {
          for (const se of s.chart.series) if (se.values.length !== s.chart.x.length) E.push(`${T} series "${se.name}" has ${se.values.length} values for ${s.chart.x.length} x labels`);
          if (s.chart.annot && s.chart.annot.at >= s.chart.x.length) E.push(`${T} chart annot.at is past the last x label`);
        }
        if ((s.sides ?? []).filter((x) => x.win).length > 1) E.push(`${T} versus has two winners`);
        // numbers on screen must come from the script (no invented facts)
        if (ss) for (const n of new Set(panelText(s).match(/\d[\d,.]*%?/g) ?? [])) if (!/^[1-9]$/.test(n) && !JSON.stringify(ss).includes(n.replace(/[.,]$/, ''))) E.push(`${T} number "${n}" is not in script scene ${sc.id}`);
        if (ds) {
          if (p.duration < minSec) E.push(`${T} ${p.duration} s is shorter than the ${brief.style} entrance (${minSec.toFixed(2)} s)`);
          else if (p.duration < goodSec) W.push(`${T} ${p.duration} s is under the ${brief.style} comfortable minimum (${goodSec.toFixed(1)} s)`);
          const w = words(panelText(s));
          if (w > 24) W.push(`${T} ${w} words on screen is a lot for one panel`);
          if (p.recipe) onStyle++;
        }
        if (pf) {
          if (p.duration > pf.max_panel_seconds) W.push(`${T} ${p.duration} s is over the ${brief.platform} pace (${pf.max_panel_seconds} s)`);
          if (first && p.duration > pf.hook_seconds + 1.5) W.push(`${T} the first panel runs ${p.duration} s; the ${brief.platform} hook window is ${pf.hook_seconds} s`);
          if ((pf.captions || !brief.voiceover) && !p.caption && !p.captions?.length) E.push(`${T} caption missing (${brief.voiceover ? brief.platform + ' needs burned-in captions' : 'captions-only film'})`);
          if (p.caption && words(p.caption) > pf.caption_words + 3) W.push(`${T} caption has ${words(p.caption)} words; ${brief.platform} reads ${pf.caption_words} at a time`);
        }
        first = false; shown++;
      }
    }
    if (ds && shown && onStyle / shown < 0.5) W.push(`only ${onStyle} of ${shown} panels name a recipe from styles/${brief.style}/style.md; aim for two thirds`);
    const lay = d.scenes.flatMap((s) => s.panels.map((p) => p.layout));
    for (let i = 2; i < lay.length; i++) if (lay[i] === lay[i - 1] && lay[i] === lay[i - 2]) { W.push(`three ${lay[i]} panels in a row from panel ${i - 1}; vary the layout`); break; }
  },
  'vfx-plan'(d, ctx, E, W) {
    const sb = ctx.get('storyboard'), brief = ctx.get('brief');
    const {lib, rules} = effects();
    const banned = brief ? rules.banned_tags[brief.style] ?? [] : [];
    const panels = new Map((sb?.scenes ?? []).flatMap((s) => s.panels.map((p) => [p.id, {...p, scene: s.id}])));
    const per = new Map(), flashes = [];
    let cost = 0;
    for (const sc of d.scenes) {
      let hits = 0;
      for (const e of sc.effects) {
        const p = panels.get(e.panel_id), T = `${e.panel_id} ${e.effect_id}:`;
        if (sb && !p) { E.push(`${T} panel is not in the storyboard`); continue; }
        if (p && p.scene !== sc.id) E.push(`${T} panel belongs to scene ${p.scene}, listed under ${sc.id}`);
        const list = per.get(e.panel_id) ?? [];
        for (const id of [e.effect_id, ...(e.merged_with ?? [])]) {
          const fx = lib.get(id);
          if (!fx) { E.push(`${T} effect "${id}" is not in library/vfx (only library effects can be rendered)`); continue; }
          const bad = fx.tags.filter((t) => banned.includes(t));
          if (bad.length) E.push(`${T} "${id}" is ${bad.join('+')}; the ${brief.style} style forbids that`);
          for (const k of Object.keys(e.params ?? {})) if (id === e.effect_id && !(k in fx.params)) E.push(`${T} unknown param "${k}" (has: ${Object.keys(fx.params).join(', ') || 'none'})`);
          if (fx.window === 'hit') hits++;
          if (fx.tags.includes('flash') && p) flashes.push(e.start);
          for (const o of list) { const both = o.tags.filter((t) => fx.tags.includes(t) && !['continuous', 'snap'].includes(t)); if (both.length && o.id !== id) W.push(`${T} "${id}" and "${o.id}" are both ${both.join('+')} on one panel`); }
          list.push(fx); cost += fx.cost_units;
        }
        per.set(e.panel_id, list);
        const fx = lib.get(e.effect_id);
        if (p && fx) {
          if (e.start + e.duration > p.duration + 0.01) E.push(`${T} runs to ${sum([e.start, e.duration])} s; the panel is ${p.duration} s`);
          if (fx.window === 'in' && e.start > 0.01) E.push(`${T} is an "in" effect; start must be 0`);
          if (fx.window === 'out' && Math.abs(e.start + e.duration - p.duration) > 0.05) E.push(`${T} is an "out" effect; it must end with the panel`);
        }
      }
      if (hits > rules.limits.max_hit_effects_per_scene) W.push(`scene ${sc.id}: ${hits} hit effects; the limit is ${rules.limits.max_hit_effects_per_scene}`);
    }
    for (const [id, list] of per) if (list.length > rules.limits.max_effects_per_panel) E.push(`panel ${id}: ${list.length} effects; the limit is ${rules.limits.max_effects_per_panel}`);
    W.push(`effects cost ${cost} budget units`);
  },
  scorecard(d, ctx, E) {
    const avg = sum(d.params.map((p) => p.score)) / d.params.length, min = Math.min(...d.params.map((p) => p.score));
    if (Math.abs(avg - d.average) > 0.06) E.push(`average is ${d.average}; the scores average ${avg.toFixed(2)}`);
    if (min !== d.minimum) E.push(`minimum is ${d.minimum}; the lowest score is ${min}`);
    if (d.passed !== (avg >= 9 && min >= 7)) E.push(`passed is ${d.passed}; the gate (average >= 9.0, minimum >= 7) says ${avg >= 9 && min >= 7}`);
    for (const p of d.params) if (p.score < 9 && p.evidence.length < 12) E.push(`"${p.name}" scored ${p.score} with no real evidence`);
  },
  credits(d, ctx, E, W) {
    const lic = readJson(path.join(SKILL, 'library', 'licences.json'));
    for (const c of d.items) {
      const l = lic.allowed[c.license];
      if (!l) E.push(`${c.asset_id}: licence "${c.license}" is not on the allow-list (unclear licence means reject)`);
      else if (l.attribution && !c.attribution) E.push(`${c.asset_id}: ${c.license} requires attribution text`);
      if (c.trademark_sensitive) W.push(`${c.asset_id}: flagged trademark-sensitive; needs the user's sign-off before render`);
    }
  },
  state(d, ctx, E) {
    for (const [k, s] of Object.entries(d.stages)) if (s.status === 'passed' && !s.output_path) E.push(`stage ${k} passed with no output_path`);
  },
  budget(d, ctx, E) {
    for (const [k, s] of Object.entries(d.stages)) { const spent = sum(d.log.filter((l) => l.stage === k).map((l) => l.units)); if (Math.abs(spent - s.spent) > 0.01) E.push(`stage ${k}: spent ${s.spent} but the log adds up to ${spent} (edit only with ledger.js)`); }
  },
};

const check = (name, file, ctx) => {
  const sp = path.join(SCHEMA_DIR, `${name}.schema.json`);
  if (!fs.existsSync(sp)) return {ok: false, lines: [`unknown schema "${name}"`]};
  let data;
  try { data = readJson(file); } catch (e) { return {ok: false, lines: [`cannot read ${file}: ${e.message}`]}; }
  const v = ajv.getSchema(name) ?? (ajv.addSchema(readJson(sp), name), ajv.getSchema(name));
  if (!v(data)) return {ok: false, lines: v.errors.slice(0, 12).map((e) => `${e.instancePath || '/'}: ${e.message}${e.params?.allowedValues ? ` (${e.params.allowedValues.join(', ')})` : e.params?.additionalProperty ? ` ("${e.params.additionalProperty}")` : ''}`)};
  const E = [], W = [];
  semantic[name]?.(data, ctx, E, W);
  return {ok: !E.length, lines: [...E, ...W.map((w) => 'WARN ' + w)]};
};
const ctxFor = (dir, prefix = '') => ({get: (n) => { const p = path.join(dir, `${prefix}${n}.json`); try { return fs.existsSync(p) ? readJson(p) : null; } catch { return null; } }});
const report = (label, r) => { console.log(`${r.ok ? 'PASS' : 'FAIL'} ${label}`); r.lines.forEach((l) => console.log(`  - ${l}`)); return r.ok ? 0 : 1; };

const a = args();
let failed = 0;
if (a.examples) {
  for (const n of [...NAMES, 'scorecard']) failed += report(`${n} (example)`, check(n, path.join(SCHEMA_DIR, `example.${n}.json`), ctxFor(SCHEMA_DIR, 'example.')));
} else if (a.work) {
  const dir = path.resolve(a.work);
  for (const n of NAMES) if (fs.existsSync(path.join(dir, `${n}.json`))) failed += report(n, check(n, path.join(dir, `${n}.json`), ctxFor(dir)));
  const rv = path.join(dir, 'reviews');
  if (fs.existsSync(rv)) for (const f of fs.readdirSync(rv).filter((f) => f.endsWith('.json'))) failed += report(`reviews/${f}`, check('scorecard', path.join(rv, f), ctxFor(dir)));
} else if (a._.length === 2) {
  const file = path.resolve(a._[1]);
  failed += report(`${a._[0]}: ${a._[1]}`, check(a._[0], file, ctxFor(path.dirname(file), path.basename(file).startsWith('example.') ? 'example.' : '')));
} else {
  console.error('Usage: node validate.js <schema-name> <file> | --work <dir> | --examples');
  process.exit(2);
}
process.exit(failed ? 1 : 0);
