#!/usr/bin/env node
// Usage: node build-film.js <work-dir> [--out film.json]
// Joins brief.json + cast.json + storyboard.json (+ vfx-plan.json) into the single render input
// film.json. The design is resolved from the style's design-system.json by id: colours and fonts
// are copied from the system, never typed by a role.
const fs = require('fs');
const path = require('path');
const {SKILL, readJson, writeJson, loadDS, args, fail} = require('./lib');

const a = args();
const work = a._[0];
if (!work) { console.error('Usage: node build-film.js <work-dir> [--out film.json]'); process.exit(2); }
const need = (n) => { const p = path.join(work, n); if (!fs.existsSync(p)) fail(`${p} missing`); return readJson(p); };
const brief = need('brief.json'), castFile = need('cast.json'), sb = need('storyboard.json');
const vfx = fs.existsSync(path.join(work, 'vfx-plan.json')) ? readJson(path.join(work, 'vfx-plan.json')) : {scenes: []};

const platforms = readJson(path.join(SKILL, 'library', 'platforms.json'));
const short = brief.platform === 'youtube' && ['15-30s', '30-1m'].includes(brief.length_bucket);
const pf = platforms[short ? 'youtube-shorts' : brief.platform];
if (!pf) fail(`unknown platform "${brief.platform}"`);

const ds = loadDS(brief.style);
const d = brief.design ?? {};
const pal = ds.palettes.find((p) => p.id === d.palette_id);
const pair = ds.fonts.find((f) => f.id === d.pairing_id);
if (!pal) fail(`brief.design.palette_id "${d.palette_id}" is not in ${brief.style}/design-system.json (run pick-design.js)`);
if (!pair) fail(`brief.design.pairing_id "${d.pairing_id}" is not in ${brief.style}/design-system.json (run pick-design.js)`);

const cast = {};
for (const as of castFile.assets) {
  if (!as.approved) continue; // unapproved cast never reaches a render
  cast[as.id] = {...as.def, id: as.id};
}
const fxByPanel = new Map();
for (const sc of vfx.scenes) for (const e of sc.effects ?? []) {
  const list = fxByPanel.get(e.panel_id) ?? [];
  for (const id of [e.effect_id, ...(e.merged_with ?? [])]) list.push({id, start: e.start, duration: e.duration, params: id === e.effect_id ? e.params : {}});
  fxByPanel.set(e.panel_id, list);
}
const errs = [];
const scenes = sb.scenes.map((sc) => ({id: sc.id, panels: sc.panels.map((p) => {
  for (const id of p.asset_ids ?? []) if (!cast[id]) errs.push(`panel ${p.id}: cast "${id}" is missing or not approved`);
  return {id: p.id, duration: p.duration, layout: p.layout, slots: p.slots, anchor: p.anchor, energy: p.energy, accent: p.accent, caption: pf.captions || !brief.voiceover ? p.caption || undefined : undefined, fx: fxByPanel.get(p.id) ?? []};
})}));
if (errs.length) fail(errs.join('\nFAIL '));

const {mood: _m, ...fonts} = pair;
const film = {
  meta: {title: brief.topic, platform: brief.platform, ratio: pf.ratio, fps: ds.motion.fps, width: pf.width, height: pf.height, safe: pf.safe},
  design: {style: brief.style, palette: {id: pal.id, roles: pal.roles}, fonts, seed: String(d.seed ?? brief.topic), system: ds},
  cast, scenes,
  audio: fs.existsSync(path.join(work, 'audio', 'manifest.json')) ? readJson(path.join(work, 'audio', 'manifest.json')).clips : [],
};
const out = a.out ?? path.join(work, 'film.json');
writeJson(out, film);
const secs = scenes.reduce((x, s) => x + s.panels.reduce((y, p) => y + p.duration, 0), 0);
console.log(`PASS ${out}: ${scenes.length} scenes, ${scenes.reduce((x, s) => x + s.panels.length, 0)} panels, ${secs.toFixed(1)} s, ${brief.style} / ${pal.id} / ${pair.id}`);
