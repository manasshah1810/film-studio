#!/usr/bin/env node
// Usage: node build-film.js <work-dir> [--out render-manifest.json] [--safe-zones]
// Joins the persona files in work/ into the ONE render input, work/render-manifest.json
// (schemas/render-manifest.schema.json), which FilmComposition renders. Everything becomes frames.
//   brief.json (Director)          meta, design ids, tier, subject mode
//   script.json (Scriptwriter)     caption chunks [from, to, text, power]
//   cast.json (Casting and Rig)    approved narrators, actors and props as layered shapes
//   storyboard.json (Art Director) panels, boxes, beats, transitions, panel captions and sfx
//   widgets.json (Widget Integrator), motion.json (Motion Choreographer), vfx-plan.json (VFX Director),
//   audio-cues.json (Sound Designer), audio/manifest.json (voice.js)
// Colours and fonts stay role names; FilmComposition resolves them from styles/<style>/design-system.json.
// Zero tokens: run it, do not read it. Exit 1 lists every problem with its fix.
const fs = require('fs');
const path = require('path');
const {SKILL, readJson, writeJson, loadDS, args, fail} = require('./lib');

const a = args();
const work = a._[0];
if (!work) { console.error('Usage: node build-film.js <work-dir> [--out render-manifest.json] [--safe-zones]'); process.exit(2); }
const opt = (n) => { const p = path.join(work, n); return fs.existsSync(p) ? readJson(p) : null; };
const need = (n) => opt(n) ?? fail(`${path.join(work, n)} missing`);
const brief = need('brief.json'), sb = need('storyboard.json');
const script = opt('script.json'), castFile = opt('cast.json') ?? {assets: []}, vfx = opt('vfx-plan.json') ?? {scenes: []};
const wSheet = opt('widgets.json') ?? {widgets: []}, mSheet = opt('motion.json') ?? {resets: []}, aSheet = opt('audio-cues.json');
const voice = opt(path.join('audio', 'manifest.json'));
const lib = new Map(readJson(path.join(SKILL, 'library', 'widgets.json')).entries.map((e) => [e.id, e]));
// bespoke scenes: ids registered in components/bespoke/registry.ts as '<topic>/<scene>': {...}
const bespokeIds = new Set([...fs.readFileSync(path.join(SKILL, 'components', 'bespoke', 'registry.ts'), 'utf8').matchAll(/^\t'([a-z0-9-]+\/[a-z0-9-]+)':/gm)].map((m) => m[1]));

const platforms = readJson(path.join(SKILL, 'library', 'platforms.json'));
const pfId = brief.platform === 'youtube' && ['15-30s', '30-1m'].includes(brief.length_bucket) ? 'youtube-shorts' : brief.platform;
const pf = platforms[pfId] ?? fail(`unknown platform "${brief.platform}"`);
const ds = loadDS(brief.style);
const d = brief.design ?? {};
const pal = ds.palettes.find((p) => p.id === d.palette_id) ?? fail(`brief.design.palette_id "${d.palette_id}" is not in ${brief.style} (run pick-design.js)`);
const pair = ds.fonts.find((f) => f.id === d.pairing_id) ?? fail(`brief.design.pairing_id "${d.pairing_id}" is not in ${brief.style} (run pick-design.js)`);
const fps = ds.motion.fps ?? 30;
const fr = (sec) => Math.round((sec ?? 0) * fps);
const E = [], W = [];

// cast: approved only. presenter -> narrator, actor -> actor, drawn props -> prop
const cast = [];
for (const as of castFile.assets) {
  if (!as.approved) { W.push(`cast ${as.id} is not approved and is left out`); continue; }
  const def = as.def;
  if (def.kind === 'character') cast.push({id: as.id, name: def.name ?? as.id, role: def.mode === 'actor' ? 'actor' : 'narrator', layers: def.layers ?? [], ...(def.rig ? {rig: def.rig} : {})});
  else if (def.kind === 'prop' && def.shapes) cast.push({id: as.id, name: def.name ?? as.id, role: 'prop', layers: [{name: 'prop', depth: 0, shapes: def.shapes}]});
  else W.push(`cast ${as.id} (${def.kind}${def.base ? ' base ' + def.base : ''}) has no drawable shapes; FilmComposition skips it`);
}
const castById = new Map(cast.map((c) => [c.id, c]));

const fontRole = (b) => {
  if (b.font) { for (const r of ['display', 'body', 'accent', 'mono']) if (pair[r].family === b.font || b.font === r) return r; E.push(`box ${b.id}: font "${b.font}" is not in pairing ${pair.id}`); }
  return b.role === 'display' ? 'display' : 'body';
};
const TRANS = (id = '') => (/whip/.test(id) ? ['whip-pan', 10] : /flip/.test(id) ? ['axis-flip', 18] : /zoom|pull/.test(id) ? ['pull-back-zoom', 20] : /dolly|push/.test(id) ? ['dolly-push', 24] : ['cut', 0]);

// panels
const panels = [];
let at = 0;
const allPanels = sb.scenes.flatMap((sc) => sc.panels.map((p) => ({...p, scene: sc.id})));
for (const p of allPanels) {
  const from = at, frames = Math.max(1, fr(p.duration)), end = from + frames;
  const boxes = (p.boxes ?? []).map((b) => {
    const o = {id: b.id, kind: b.kind, x: b.x, y: b.y, w: b.w, h: b.h};
    for (const k of ['role', 'text', 'lines', 'px', 'color', 'bg']) if (b[k] !== undefined) o[k] = b[k];
    if (b.kind === 'text' || b.kind === 'caption' || typeof b.text === 'string') o.font = fontRole(b);
    if (typeof b.from === 'number') o.from = from + fr(b.from);
    if (typeof b.to === 'number') o.to = from + fr(b.to);
    return o;
  });
  const boxIds = new Set(boxes.map((b) => b.id));
  const firstText = boxes.find((b) => b.kind === 'text' && b.role === 'display') ?? boxes.find((b) => b.kind === 'text');
  const subject = boxes.filter((b) => b.kind === 'subject' || b.kind === 'face');
  const castIn = (p.asset_ids ?? []).filter((id) => castById.has(id)).slice(0, 2).map((id, i) => {
    const slot = (p.slots?.cast ?? []).find((c) => c.id === id);
    const sbox = subject[i] ?? (castById.get(id).role === 'narrator' ? {x: 6, y: 40, w: 52, h: 40} : {x: 30 + i * 20, y: 40, w: 36, h: 40});
    return {id, box: {x: sbox.x, y: sbox.y, w: sbox.w, h: sbox.h}, ...(slot?.flip ? {flip: true} : {}), from};
  });
  for (const id of p.asset_ids ?? []) if (!castById.has(id)) W.push(`panel ${p.id}: cast "${id}" is not approved or not drawable; it is left out`);
  const beats = (p.beats ?? []).map((b) => ({frame: from + fr(b.at), frames: Math.max(1, fr(b.duration ?? 0.4)), kind: b.kind ?? 'emphasis', ...(b.target ? {target: b.target} : {}), ...(b.easing ? {easing: b.easing} : {})}));
  const widgets = [];
  const addWidget = (w, box) => {
    const e = lib.get(w.id);
    if (!e) return E.push(`panel ${p.id}: widget "${w.id}" is not in library/widgets.json. Fix: pick an id from that file.`);
    if (!box || typeof box.x !== 'number') return E.push(`panel ${p.id}: widget "${w.id}" has no box {x, y, w, h}`);
    const wf = from + fr(w.at);
    widgets.push({id: w.id, anchor: w.anchor, from: wf, frames: Math.max(1, end - wf), box: {x: box.x, y: box.y, w: box.w, h: box.h}, props: w.props ?? {}});
  };
  for (const w of p.widgets ?? []) addWidget(w, w);
  for (const w of wSheet.widgets.filter((x) => x.panel === p.id)) if (!widgets.some((x) => x.id === w.id)) addWidget(w, w.box);
  const bespoke = [];
  for (const b of p.bespoke ?? []) {
    if (!bespokeIds.has(b.id)) { E.push(`panel ${p.id}: bespoke scene "${b.id}" is not registered in components/bespoke/registry.ts. Fix: code it in components/bespoke/<topic>/ and register it.`); continue; }
    const bf = from + fr(b.at);
    bespoke.push({id: b.id, anchor: b.anchor, from: bf, frames: Math.max(1, end - bf), box: {x: b.x, y: b.y, w: b.w, h: b.h}, props: b.props ?? {}});
  }
  const motion = [];
  let transition;
  const [tp, tf] = TRANS(p.transition?.id);
  if (p.transition && tp !== 'cut') transition = {primitive: tp, frames: tf, ...(p.transition.easing ? {easing: p.transition.easing} : {})};
  for (const r of mSheet.resets.filter((x) => (x.panel ? x.panel === p.id : x.frame >= from && x.frame < end))) {
    const isTrans = ['whip-pan', 'axis-flip', 'pull-back-zoom'].includes(r.primitive) && r.frame === from;
    if (isTrans) { transition = {primitive: r.primitive, frames: r.frames ?? TRANS(r.primitive)[1]}; continue; }
    const textual = ['text-decode', 'odometer-roll', 'spring-overshoot', 'rgb-split-glitch', 'stop-motion-jitter', 'axis-flip', 'gravity-drop', 'path-draw-on'].includes(r.primitive);
    const target = r.target ?? (textual && firstText ? firstText.id : 'panel');
    if (target !== 'panel' && !boxIds.has(target)) E.push(`motion.json ${r.primitive} at ${r.frame}: target "${target}" is not a box of ${p.id}`);
    motion.push({primitive: r.primitive, frame: r.frame, ...(r.frames ? {frames: r.frames} : {}), target, ...(r.params ? {params: r.params} : {}), ...(r.note ? {note: r.note} : {})});
  }
  const fx = [];
  for (const sc of vfx.scenes) for (const e of sc.effects ?? []) if (e.panel_id === p.id) for (const id of [e.effect_id, ...(e.merged_with ?? [])]) fx.push({id, from: from + fr(e.start), frames: Math.max(1, fr(e.duration)), params: id === e.effect_id ? e.params ?? {} : {}});
  // longest gap between visual events
  const ev = [from, ...beats.map((b) => b.frame), ...motion.map((m) => m.frame), ...widgets.map((w) => w.from), ...bespoke.map((b) => b.from), ...boxes.filter((b) => typeof b.from === 'number').map((b) => b.from)].filter((f) => f >= from && f < end).sort((x, y) => x - y);
  const gap = Math.max(...[...ev, end].map((f, i, arr) => (i ? f - arr[i - 1] : 0)));
  const max_hold_seconds = Math.round((gap / fps) * 100) / 100;
  if (max_hold_seconds > 3.5) E.push(`panel ${p.id}: ${max_hold_seconds} s with no new visual event (max 3.5 s). Fix: add a beat, widget or motion reset inside the gap, or split the panel.`);
  panels.push({id: p.id, scene: p.scene, from, frames, max_hold_seconds, ...(transition ? {transition} : {}), boxes, cast: castIn, widgets, ...(bespoke.length ? {bespoke} : {}), motion, beats, ...(fx.length ? {fx} : {}), _sfx: p.sfx ?? [], _captions: p.captions ?? (p.caption ? [p.caption] : [])});
  at = end;
}
const total = at;

// captions: the script's frame-timed chunks win; else the storyboard's panel chunks, shared by word count
let captions = [];
const scriptCaps = (script?.scenes ?? []).flatMap((s) => s.captions ?? []);
if (scriptCaps.length) captions = scriptCaps.map(([f0, f1, text, power]) => ({from: f0, to: Math.min(f1, total), text, ...(power ? {power} : {})}));
else for (const p of panels) {
  const n = p._captions.reduce((s, c) => s + c.split(/\s+/).length, 0) || 1;
  let f = p.from;
  for (const c of p._captions) { const len = Math.max(1, Math.round((p.frames * c.split(/\s+/).length) / n)); captions.push({from: f, to: Math.min(p.from + p.frames, f + len), text: c}); f += len; }
}
if (!(pf.captions || !brief.voiceover)) captions = [];

// sound: every cue is tied to the visual event it lands on
const events = panels.flatMap((p) => [
  {key: `cut:${p.id}`, f: p.from},
  ...(p.transition ? [{key: `transition:${p.id}`, f: p.from + p.transition.frames}] : []),
  ...p.beats.map((b, i) => ({key: `beat:${p.id}#${i}`, f: b.frame})),
  ...p.motion.map((m, i) => ({key: `motion:${p.id}#${i}`, f: m.frame})),
  ...p.widgets.map((w, i) => ({key: `widget:${p.id}#${i}`, f: w.from})),
  ...(p.bespoke ?? []).map((b, i) => ({key: `bespoke:${p.id}#${i}`, f: b.from})),
]);
const sfxFile = (id) => { for (const ext of ['wav', 'mp3', 'ogg']) { const rel = `audio/sfx/${id}.${ext}`; if (fs.existsSync(path.join(work, rel))) return rel; } return null; };
const syncOf = (peak, label) => {
  const best = events.reduce((b, e) => (Math.abs(e.f - peak) < Math.abs(b.f - peak) ? e : b), events[0]);
  if (Math.abs(best.f - peak) > 2) { E.push(`${label} peaks at frame ${peak}; the nearest visual event is ${best.key} at ${best.f}. Fix: move the cue onto a keyframe (2 frames at most).`); return best.key; }
  return best.key;
};
const sfx = [];
const pushCue = (id, peak, preRoll, db, label) => sfx.push({id, frame: Math.max(0, peak - preRoll), peak_frame: peak, pre_roll: preRoll, db, sync: syncOf(peak, label), file: sfxFile(id)});
for (const c of aSheet?.cues ?? []) pushCue(c.sfx, c.frame, c.pre_roll ?? 0, c.db ?? -12, `audio-cues ${c.sfx}`);
for (const p of panels) for (const s of p._sfx) { const peak = s.frame ?? p.from + fr(s.at); if (!sfx.some((x) => x.peak_frame === peak && x.id === s.id)) pushCue(s.id, peak, 0, -12, `storyboard ${p.id} sfx ${s.id}`); }
sfx.sort((x, y) => x.frame - y.frame);
for (let i = 1; i < sfx.length; i++) if (sfx[i].peak_frame === sfx[i - 1].peak_frame) W.push(`two sounds peak on frame ${sfx[i].peak_frame} (${sfx[i - 1].id}, ${sfx[i].id}); keep the stronger one`);

const clips = (voice?.clips ?? []).map((c) => ({file: c.file, from: fr(c.start)}));
const segments = aSheet?.duck?.voiceover ?? (voice?.clips ?? []).map((c) => [fr(c.start), fr(c.start + (c.seconds ?? 0))]);
const voiceover = brief.voiceover && clips.length ? {clips, segments} : null;
if (brief.voiceover && !clips.length) W.push('the brief has a voiceover but work/audio/manifest.json has no clips (run voice.js make)');
let music = null;
if (aSheet?.music?.bed) {
  const file = ['wav', 'mp3', 'ogg'].map((x) => `audio/music/${aSheet.music.bed}.${x}`).find((rel) => fs.existsSync(path.join(work, rel)));
  if (!file) W.push(`music bed "${aSheet.music.bed}" has no file in work/audio/music/; the film renders without music`);
  else music = {file, open_db: aSheet.music.open_db ?? -8, ducked_db: aSheet.music.ducked_db ?? -18, attack_frames: aSheet.duck?.attack_frames ?? 6, release_frames: aSheet.duck?.release_frames ?? 12, merge_gaps_under: aSheet.duck?.merge_gaps_under ?? 15, cuts: (aSheet.music.cuts ?? []).map((c) => ({from: c.from, to: c.to}))};
}

// the pre-mixed 3-layer track (scripts/sound-bed.js): narration, pulse bed, sub-bass hits and transition SFX in one file
const mixInfo = opt(path.join('audio', 'mix.json'));
const mix = brief.voiceover && mixInfo && fs.existsSync(path.join(work, mixInfo.file)) ? {file: mixInfo.file, layers: mixInfo.layers ?? []} : null;
if (E.length) fail(E.join('\nFAIL '));
const manifest = {
  version: 1,
  meta: {title: brief.topic, platform: pfId, ratio: pf.ratio, fps, width: pf.width, height: pf.height, frames: total, safe: pf.safe},
  design: {style: brief.style, palette_id: pal.id, palette_tier: pal.tier, palette_size: Object.keys(pal.roles).length, pairing_id: pair.id, seed: String(d.seed ?? brief.topic)},
  subject_mode: ds.subject_mode ?? brief.subject_mode ?? 'ui-first',
  cast,
  panels: panels.map(({_sfx, _captions, ...p}) => p),
  captions,
  audio: {sfx, voiceover, music, ...(voiceover ? {sfx_duck: aSheet?.duck?.sfx_gain ?? 0.25} : {}), ...(mix ? {mix} : {})},
  showSafeZones: !!a['safe-zones'],
};
const out = a.out ?? path.join(work, 'render-manifest.json');
writeJson(out, manifest);
W.forEach((w) => console.log('WARN ' + w));
console.log(`PASS ${out}: ${panels.length} panels, ${total} frames (${(total / fps).toFixed(1)} s), ${sfx.length} sfx, ${captions.length} captions, ${brief.style} / ${pal.id} (${pal.tier}) / ${pair.id}. Next: node scripts/validate-schema.js render-manifest ${out}`);
