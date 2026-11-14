#!/usr/bin/env node
// Usage:
//   node check-design.js --systems [style]      validate every (or one) styles/<id>/design-system.json
//   node check-design.js --systems --ds <file>  validate one design-system file anywhere
//   node check-design.js <work-dir | film.json | storyboard.json> [--ds <file>]
//                                               contrast of every text box + palette lock
// Zero tokens: run it, do not read it. Exit 0 = PASS, 1 = FAIL (each line says what to change).
//
// Contrast (WCAG 2.x AA): display text >= 3.0:1, every other text >= 4.5:1.
// Palette lock: every colour, font and easing in the plan comes from the ONE chosen design system.
const path = require('path');
const {readJson, listStyles, loadDS, contrast, hexRgb, args} = require('./lib');
const {load, boxesOf, isText, NAMED_EASINGS, BANNED_EASINGS} = require('./plan');

const BODY_MIN = 4.5, DISPLAY_MIN = 3.0, TYPE_RATIO = 2.2;
const TIERS = {focused: [3, 5], expanded: [8, 12]};
const HEX6 = /^#[0-9a-fA-F]{6}$/;
const COLOR_KEYS = new Set(['color', 'bg', 'fill', 'stroke', 'accent']);
const FREE_COLORS = new Set(['none', 'transparent']);
// the gradients an image model or a UI kit hands out by default
const DEFAULT_GRADIENTS = [['#667eea', '#764ba2'], ['#6366f1', '#8b5cf6'], ['#4f46e5', '#7c3aed'], ['#3b82f6', '#8b5cf6'], ['#8e2de2', '#4a00e0'], ['#6a11cb', '#2575fc'], ['#a855f7', '#3b82f6']];

const hsl = (hex) => {
  const [r, g, b] = hexRgb(hex).map((v) => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
  if (!d) return [0, 0, l];
  const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, d / (1 - Math.abs(2 * l - 1)), l];
};
const vivid = (hex, lo, hi) => { const [h, s, l] = hsl(hex); return h >= lo && h < hi && s >= 0.35 && l >= 0.2 && l <= 0.8; };
const isBlue = (h) => vivid(h, 200, 255), isPurple = (h) => vivid(h, 255, 300);

/** Rule 7. Any gradient (the word "gradient" followed by its colours) that runs blue to purple. */
function gradientErrs(text, tag, roles) {
  const out = new Set();
  for (const m of text.matchAll(/gradient/gi)) {
    const win = text.slice(m.index, m.index + 200);
    const hexes = (win.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map((h) => h.toLowerCase());
    for (const [r, h] of Object.entries(roles ?? {})) if (win.includes(`"${r}"`)) hexes.push(h.toLowerCase());
    if (hexes.length < 2) continue;
    const known = DEFAULT_GRADIENTS.find(([a, b]) => hexes.includes(a) && hexes.includes(b));
    const blue = hexes.find(isBlue), purple = hexes.find(isPurple);
    if (known || (blue && purple)) out.add(`${tag} has a purple-blue gradient (${known ? known.join(' to ') : `${blue} to ${purple}`}). Fix: use one flat palette colour, or a gradient between two shades of the same hue.`);
  }
  return [...out];
}

/** A design-system.json on its own. */
function checkSystem(ds, tag) {
  const E = [], err = (m) => E.push(`${tag}: ${m}`);
  if (!ds || typeof ds !== 'object') return [`${tag}: not a JSON object`];
  if (!ds.style) err('"style" (the style id) is missing');
  if (!['layered', 'ui-first'].includes(ds.subject_mode)) err(`"subject_mode" is ${JSON.stringify(ds.subject_mode)}. Fix: set it to "layered" or "ui-first" (stick figures are banned).`);
  if (ds.figure && (ds.figure.body === 'line' || ds.figure.limbStyle === 'line')) err('"figure" describes a line-limbed stick rig. Fix: delete it; a subject is layered or the style is ui-first.');
  if (!ds.palettes?.length) err('needs at least one palette');
  const ids = new Set();
  for (const p of ds.palettes ?? []) {
    const pt = `palette ${p.id}`;
    if (!p.id || ids.has(p.id)) err(`${pt}: id is missing or repeated`);
    ids.add(p.id);
    const roles = p.roles ?? {}, hexes = Object.values(roles);
    const bad = Object.entries(roles).filter(([, h]) => !HEX6.test(h)).map(([r]) => r);
    if (bad.length) { err(`${pt}: roles ${bad.join(', ')} are not 6-digit hex`); continue; }
    if (!roles.bg || !roles.ink) err(`${pt}: roles "bg" and "ink" are required`);
    const n = new Set(hexes.map((h) => h.toLowerCase())).size, range = TIERS[p.tier];
    if (!range) err(`${pt}: tier is ${JSON.stringify(p.tier)}. Fix: "focused" (3-5 colours) or "expanded" (8-12 colours).`);
    else if (n < range[0] || n > range[1]) err(`${pt}: ${n} distinct colours; a ${p.tier} palette has ${range[0]} to ${range[1]}. Fix: ${n < range[0] ? 'add' : 'remove'} ${n < range[0] ? range[0] - n : n - range[1]} or change the tier.`);
    // every text role on every surface role
    for (const [kind, min] of [['body', BODY_MIN], ['display', DISPLAY_MIN]]) for (const t of ds.text_roles?.[kind] ?? []) for (const s of ds.surface_roles ?? []) {
      if (t === s) continue;
      if (!roles[t] || !roles[s]) { err(`${pt}: role "${!roles[t] ? t : s}" is named in text_roles/surface_roles but is not in this palette`); continue; }
      const c = contrast(roles[t], roles[s]);
      if (c < min) err(`${pt}: ${kind} text "${t}" ${roles[t]} on "${s}" ${roles[s]} is ${c.toFixed(2)}:1; needs ${min}:1. Fix: change one of the two colours, or remove "${t}" from text_roles.${kind}.`);
    }
  }
  if (!ds.text_roles?.body?.length || !ds.text_roles?.display?.length) err('"text_roles" needs {"body": [roles], "display": [roles]}: the roles text may be set in');
  if (!ds.surface_roles?.length) err('"surface_roles" needs the roles text may sit on, e.g. ["bg", "surface"]');
  if (!ds.fonts?.length) err('needs at least one font pairing');
  for (const f of ds.fonts ?? []) if (!f.id || !f.display?.family || !f.body?.family) err(`font pairing ${f.id ?? '?'}: needs id, display.family and body.family`);
  const ts = ds.type_scale ?? {};
  if (!(ts.display > 0) || !(ts.body > 0)) err('"type_scale" needs numeric "display" and "body" (px on the real frame)');
  else if (ts.display / ts.body < TYPE_RATIO) err(`type_scale display ${ts.display} / body ${ts.body} = ${(ts.display / ts.body).toFixed(2)}; needs ${TYPE_RATIO}. Fix: display >= ${Math.ceil(ts.body * TYPE_RATIO)}.`);
  const ez = ds.motion?.easings ?? {};
  if (!(ds.motion?.fps > 0)) err('"motion.fps" is missing');
  if (!Object.keys(ez).length) err('"motion.easings" needs at least one named curve');
  for (const [name, v] of Object.entries(ez)) {
    if (BANNED_EASINGS.includes(name)) err(`easing "${name}" is a default curve. Fix: name a spring or a bezier, e.g. "snap": [0.16, 1, 0.3, 1].`);
    const bez = Array.isArray(v) && v.length === 4 && v.every((x) => typeof x === 'number'), spring = v && typeof v === 'object' && !Array.isArray(v) && v.spring;
    if (!bez && !spring) err(`easing "${name}" must be a 4-number bezier or {"spring": {...}}`);
    if (bez && v[0] === v[1] && v[2] === v[3]) err(`easing "${name}" ${JSON.stringify(v)} is linear. Fix: use a real curve.`);
  }
  return [...E, ...gradientErrs(JSON.stringify(ds), tag, null)];
}

/** Deep walk of plan JSON: every string with its key and path. */
function strings(node, where, key, out = []) {
  if (typeof node === 'string') out.push({where, key, v: node});
  else if (Array.isArray(node)) node.forEach((v, i) => strings(v, `${where}[${i}]`, key, out));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) strings(v, `${where}.${k}`, k, out);
  return out;
}

/** Rules 16 and 25 on a loaded plan. Returns {contrast: [], lock: []}. */
function checkPlan(P) {
  const C = [], L = [];
  if (!P.ds) return {contrast: ['no design system found. Fix: brief.style must name a folder in styles/ that has design-system.json.'], lock: ['no design system found. Fix: brief.style must name a folder in styles/ that has design-system.json.']};
  if (!P.roles) return {contrast: ['no palette resolved. Fix: brief.design.palette_id must be a palette id in the design system.'], lock: ['no palette resolved. Fix: brief.design.palette_id must be a palette id in the design system.']};
  const roles = P.roles, palette = new Set(Object.values(roles).map((h) => h.toLowerCase()));
  const hexOf = (v) => (typeof v !== 'string' ? null : HEX6.test(v) ? v : roles[v] ?? null);

  // 16: contrast of every text box
  for (const p of P.panels) for (const b of boxesOf(p).filter(isText)) {
    const tag = `${p.id} box "${b.id ?? b.text?.slice(0, 20)}"`, fg = hexOf(b.color), bg = hexOf(b.bg);
    if (!fg || !bg) { C.push(`${tag}: text needs "color" and "bg" as palette role names (have color=${JSON.stringify(b.color)}, bg=${JSON.stringify(b.bg)}). Roles: ${Object.keys(roles).join(', ')}.`); continue; }
    const min = b.role === 'display' ? DISPLAY_MIN : BODY_MIN, c = contrast(fg, bg);
    if (c < min) C.push(`${tag}: ${b.role ?? 'body'} text ${fg} on ${bg} is ${c.toFixed(2)}:1; needs ${min}:1. Fix: set color to "${Object.keys(roles).filter((r) => contrast(roles[r], bg) >= min).join('" or "') || 'a different bg'}".`);
  }

  // 25: one design system, nothing outside it
  if (P.brief && P.ds.style && P.brief.style !== P.ds.style) L.push(`brief.style "${P.brief.style}" but the design system is "${P.ds.style}"`);
  const fams = new Set(['display', 'body', 'accent', 'mono'].map((r) => P.pairing?.[r]?.family).filter(Boolean));
  const easings = new Set([...Object.keys(P.ds.motion?.easings ?? {}), ...NAMED_EASINGS]);
  const src = [...P.panels.flatMap((p) => strings({slots: p.slots, boxes: p.boxes, widgets: p.widgets, beats: p.beats, transition: p.transition, accent: p.accent, style: p.style, palette_id: p.palette_id, pairing_id: p.pairing_id}, p.id, '')), ...strings(P.cast?.assets ?? [], 'cast', '')];
  for (const {where, key, v} of src) {
    for (const h of v.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) ?? []) if (!palette.has(h.toLowerCase())) L.push(`${where}: ${h} is not in palette "${P.brief?.design?.palette_id ?? P.film?.design?.palette?.id}". Fix: use a role name (${Object.keys(roles).join(', ')}).`);
    if (COLOR_KEYS.has(key) && !/#/.test(v) && !roles[v] && !FREE_COLORS.has(v)) L.push(`${where}: "${v}" is not a palette role. Fix: one of ${Object.keys(roles).join(', ')}.`);
    if (key === 'font' && !fams.has(v)) L.push(`${where}: font "${v}" is not in the chosen pairing. Fix: one of ${[...fams].join(', ') || '(no pairing resolved: set brief.design.pairing_id)'}.`);
    if (key === 'easing' && !easings.has(v)) L.push(`${where}: easing "${v}" is not in the design system. Fix: one of ${[...easings].slice(0, 8).join(', ')}.`);
    if (key === 'style' && P.brief && v !== P.brief.style) L.push(`${where}: panel overrides the style with "${v}". Fix: delete it; one film, one style.`);
    if ((key === 'palette_id' || key === 'pairing_id') && P.brief && v !== P.brief.design?.[key]) L.push(`${where}: panel overrides ${key} with "${v}". Fix: delete it.`);
  }
  return {contrast: C, lock: [...new Set(L)]};
}

module.exports = {checkSystem, checkPlan, gradientErrs, BODY_MIN, DISPLAY_MIN, TYPE_RATIO};

if (require.main === module) {
  const a = args();
  const done = (errs, ok) => { if (errs.length) { errs.forEach((e) => console.error('FAIL ' + e)); console.error(`${errs.length} problem(s)`); process.exit(1); } console.log('PASS ' + ok); process.exit(0); };
  if (a.systems) {
    if (typeof a.ds === 'string') done(checkSystem(readJson(a.ds), path.basename(path.dirname(path.resolve(a.ds)))), `design system ${a.ds}`);
    const styles = typeof a.systems === 'string' ? [a.systems] : listStyles();
    if (!styles.length) { console.log('PASS 0 design systems (no style is built yet; see references/style-cheatsheet.md)'); process.exit(0); }
    const missing = styles.filter((s) => !listStyles().includes(s));
    if (missing.length) done(missing.map((s) => `style "${s}" is not built: styles/${s}/design-system.json does not exist. Do not offer it.`), '');
    done(styles.flatMap((s) => checkSystem(loadDS(s), s)), `${styles.length} design system(s): ${styles.join(', ')}`);
  }
  const target = a._[0];
  if (!target) { console.error('Usage: node check-design.js --systems [style] | <work-dir | film.json | storyboard.json> [--ds file]'); process.exit(2); }
  const P = load(target, {ds: typeof a.ds === 'string' ? a.ds : undefined});
  const r = checkPlan(P);
  done([...(P.ds ? checkSystem(P.ds, P.ds.style ?? 'design system') : []), ...r.contrast, ...r.lock, ...gradientErrs(JSON.stringify(P.storyboard ?? {}), 'storyboard', P.roles)], `design: contrast and palette lock hold for ${P.panels.length} panels`);
}
