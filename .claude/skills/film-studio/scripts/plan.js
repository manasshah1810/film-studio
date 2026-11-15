// Shared plan loader for the zero-token validators (check-ai-tells, check-design, check-safezones).
// Turns a work folder (or one film.json / storyboard.json) into one flat object: panels with start
// frames, visual events, motion intervals, sound cues, text, boxes. No rendering, no network.
//
// Units the validators read:
//   time   panel.duration and every `at` are SECONDS; everything is converted to frames at fps.
//   boxes  x, y, w, h are PERCENT of the frame (0-100), origin top-left. `px` is the font size in
//          pixels on the real frame (1080 wide for 9:16).
const fs = require('fs');
const path = require('path');
const {SKILL, readJson} = require('./lib');

const EDGES = ['tl', 't', 'tr', 'l', 'r', 'bl', 'b', 'br'];
const NAMED_EASINGS = ['spring-snappy', 'spring-bouncy', 'spring-gentle', 'spring-heavy', 'ease-out-expo', 'ease-out-quint', 'ease-out-back', 'ease-out-cubic', 'ease-in-out-cubic', 'ease-in-expo', 'anticipate', 'overshoot'];
const BANNED_EASINGS = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'none', 'default'];
// keys whose string values are ids or settings, never words a viewer reads
const NOT_COPY = new Set(['id', 'layout', 'anchor', 'energy', 'accent', 'recipe', 'pose', 'expr', 'state', 'type', 'role', 'kind', 'easing', 'color', 'bg', 'fill', 'stroke', 'scale', 'font', 'prop', 'cast', 'media', 'scene', 'beat', 'status', 'source', 'emotion', 'visual_intent', 'unit', 'gradient', 'tier', 't', 'effect_id', 'panel_id', 'reason']);

const opt = (p) => (fs.existsSync(p) ? readJson(p) : null);
const words = (s) => String(s ?? '').trim().split(/\s+/).filter(Boolean);
const sentences = (s) => String(s ?? '').split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);

/** Every string a viewer could read under `node`, with a path label. */
function copyOf(node, where, out = []) {
  if (typeof node === 'string') out.push({where, text: node});
  else if (Array.isArray(node)) node.forEach((v, i) => copyOf(v, `${where}[${i}]`, out));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) { if (typeof v === 'string' && NOT_COPY.has(k)) continue; copyOf(v, where ? `${where}.${k}` : k, out); }
  return out;
}

function load(target, o = {}) {
  if (!fs.existsSync(target)) throw new Error(`${target} does not exist`);
  let work = target, film = null, sbOnly = null;
  if (!fs.statSync(target).isDirectory()) {
    const j = readJson(target);
    work = path.dirname(target);
    if (j.meta && j.design) film = j; else if (j.scenes) sbOnly = j; else throw new Error(`${target} is neither a film.json nor a storyboard.json`);
  }
  const angles = opt(path.join(work, 'angles.json')), brief = opt(path.join(work, 'brief.json')), script = opt(path.join(work, 'script.json')), cast = opt(path.join(work, 'cast.json')), vfx = opt(path.join(work, 'vfx-plan.json'));
  const storyboard = film ?? sbOnly ?? opt(path.join(work, 'storyboard.json'));
  const widgetsSheet = opt(path.join(work, 'widgets.json')), motionSheet = opt(path.join(work, 'motion.json')), audioSheet = opt(path.join(work, 'audio-cues.json'));

  // one design system: --ds file, else the one inside film.json, else styles/<brief.style>/
  let ds = null, dsPath = null;
  const local = path.join(work, 'design-system.json'); // fixtures only
  if (o.ds) { ds = readJson(o.ds); dsPath = o.ds; }
  else if (film?.design?.system) { ds = film.design.system; dsPath = 'film.json design.system'; }
  else if (brief?.style && fs.existsSync(path.join(SKILL, 'styles', brief.style, 'design-system.json'))) { dsPath = path.join(SKILL, 'styles', brief.style, 'design-system.json'); ds = readJson(dsPath); }
  else if (o.allowLocalDs && fs.existsSync(local)) { ds = readJson(local); dsPath = local; }
  const palId = film?.design?.palette?.id ?? brief?.design?.palette_id;
  const roles = film?.design?.palette?.roles ?? ds?.palettes?.find((p) => p.id === palId)?.roles ?? null;
  const pairing = film?.design?.fonts ?? ds?.fonts?.find((f) => f.id === brief?.design?.pairing_id) ?? null;
  const fps = film?.meta?.fps ?? ds?.motion?.fps ?? 30;

  let ratio = o.ratio ?? film?.meta?.ratio, W = film?.meta?.width, H = film?.meta?.height;
  if (!ratio && brief?.platform) {
    const pfs = readJson(path.join(SKILL, 'library', 'platforms.json'));
    const pf = pfs[brief.platform === 'youtube' && ['15-30s', '30-1m'].includes(brief.length_bucket) ? 'youtube-shorts' : brief.platform];
    if (pf) { ratio = pf.ratio; W = pf.width; H = pf.height; }
  }
  ratio ??= '9:16'; W ??= 1080; H ??= 1920;

  const fxBy = new Map();
  for (const sc of vfx?.scenes ?? []) for (const e of sc.effects ?? []) fxBy.set(e.panel_id, [...(fxBy.get(e.panel_id) ?? []), e]);
  const panels = [], events = [], motion = [], sfx = [];
  const enter = ds?.motion?.enter_frames ?? 12;
  const fr = (sec) => Math.round((sec ?? 0) * fps);
  let f = 0;
  const scenes = storyboard?.scenes ?? [];
  scenes.forEach((sc, si) => (sc.panels ?? []).forEach((p) => {
    const frames = fr(p.duration), start = f;
    const fx = [...(p.fx ?? []).map((e) => ({effect_id: e.id, ...e})), ...(fxBy.get(p.id) ?? [])];
    panels.push({...p, scene: sc.id, sceneIndex: si, index: panels.length, start, frames, fx});
    events.push({f: start, kind: 'cut', at: p.id});
    motion.push([start, start + Math.min(enter, frames)]);
    for (const b of p.beats ?? []) { const bf = start + fr(b.at); events.push({f: bf, kind: b.kind ?? 'beat', at: p.id}); motion.push([bf, bf + Math.max(1, fr(b.duration ?? 0.4))]); }
    for (const w of p.widgets ?? []) { const wf = start + fr(w.at); events.push({f: wf, kind: 'widget', at: p.id}); motion.push([wf, wf + enter]); }
    // a bespoke scene animates for its whole stay on screen
    for (const b of p.bespoke ?? []) { const bf = start + fr(b.at); events.push({f: bf, kind: 'bespoke', at: p.id}); motion.push([bf, start + frames]); }
    for (const e of fx) { const ef = start + fr(e.start); events.push({f: ef, kind: 'fx', at: p.id}); motion.push([ef, Math.min(start + frames, e.duration ? ef + fr(e.duration) : start + frames)]); }
    for (const s of p.sfx ?? []) sfx.push({id: s.id, f: s.frame ?? start + fr(s.at), scene: sc.id, at: p.id});
    f += frames;
  }));
  const panelAt = (frame) => panels.find((p) => frame >= p.start && frame < p.start + p.frames) ?? panels[panels.length - 1];
  for (const s of vfx?.sfx ?? film?.sfx ?? []) { const p = panelAt(s.frame); sfx.push({id: s.id, f: s.frame, scene: p?.scene, at: p?.id}); }
  // Persona sheets (references/director-cheatsheet.md): widget-integrator -> widgets.json, motion-choreographer ->
  // motion.json, sound-designer -> audio-cues.json. Merged here so every validator sees the film as it will render.
  const byId = new Map(panels.map((p) => [p.id, p]));
  for (const w of widgetsSheet?.widgets ?? []) {
    const p = byId.get(w.panel);
    if (!p) continue;
    const merged = {id: w.id, anchor: w.anchor, at: w.at, easing: w.easing, ...(w.box ?? {}), props: w.props ?? {}};
    p.widgets = [...(p.widgets ?? []).filter((x) => x.id !== w.id), merged];
    const wf = p.start + fr(w.at);
    events.push({f: wf, kind: 'widget', at: p.id}); motion.push([wf, wf + enter]);
  }
  for (const r of motionSheet?.resets ?? []) {
    const p = byId.get(r.panel) ?? panelAt(r.frame);
    events.push({f: r.frame, kind: r.primitive, at: p?.id}); motion.push([r.frame, r.frame + (r.frames ?? enter)]);
  }
  for (const c of audioSheet?.cues ?? []) { const p = panelAt(c.frame); sfx.push({id: c.sfx, f: c.frame, scene: p?.scene, at: p?.id}); } // frame = the peak; the file starts pre_roll earlier
  events.sort((a, b) => a.f - b.f);

  return {work, angles, brief, script, cast, vfx, storyboard, film, widgetsSheet, motionSheet, audioSheet, ds, dsPath, roles, pairing, fps, ratio, W, H, scenes, panels, events, motion, sfx, totalFrames: f};
}

/** Boxes of a panel. A widget that carries x/y/w/h counts as a box of kind "widget"; a bespoke scene as kind "bespoke". */
const boxesOf = (p) => [...(p.boxes ?? []), ...(p.widgets ?? []).filter((w) => typeof w.x === 'number').map((w) => ({kind: 'widget', ...w})), ...(p.bespoke ?? []).map(({id, x, y, w, h}) => ({kind: 'bespoke', id, x, y, w, h}))];
const isText = (b) => b.kind === 'text' || b.kind === 'caption' || typeof b.text === 'string';
const captionsOf = (p) => (p.captions ?? (p.caption ? [p.caption] : [])).map((c) => (typeof c === 'string' ? c : c.text));
/** All copy: script first, then storyboard panels in order. */
const allCopy = (P) => [
  ...(P.script ? (P.script.scenes ?? []).flatMap((s) => [{where: `script ${s.id} narration`, text: s.narration}, {where: `script ${s.id} on_screen_text`, text: s.on_screen_text}]) : []),
  ...P.panels.flatMap((p) => copyOf({slots: p.slots, caption: p.caption, captions: p.captions, boxes: p.boxes, widgets: p.widgets}, `panel ${p.id}`)),
].filter((t) => t.text);

module.exports = {EDGES, NAMED_EASINGS, BANNED_EASINGS, load, boxesOf, isText, captionsOf, allCopy, copyOf, words, sentences};
