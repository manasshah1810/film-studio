#!/usr/bin/env node
// Usage:
//   node check-design.js --systems [style]   validate every (or one) styles/<id>/design-system.json
//   node check-design.js <film.json>         fail if a render input uses any colour or font outside
//                                            its chosen palette and pairing
// Contrast: WCAG 2.x AA, 4.5:1 normal text, 3:1 large text and graphics [CHECK against current WCAG].
const {ROLES, FONT_ROLES, readJson, listStyles, loadDS, contrast, roleHex, dist, fontInfo, args} = require('./lib');

const HEX = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;
const errs = [];
const err = (m) => errs.push(m);

function checkSystem(style) {
  const ds = loadDS(style), tag = `${style}:`;
  if (ds.style !== style) err(`${tag} "style" is "${ds.style}"`);
  if (ds.palettes?.length !== 10) err(`${tag} needs exactly 10 palettes, has ${ds.palettes?.length}`);
  if (ds.fonts?.length !== 10) err(`${tag} needs exactly 10 font pairings, has ${ds.fonts?.length}`);
  const ids = new Set();
  for (const p of ds.palettes ?? []) {
    if (ids.has(p.id)) err(`${tag} duplicate palette id ${p.id}`);
    ids.add(p.id);
    for (const k of ['name', 'mood']) if (!p[k]) err(`${tag} palette ${p.id} has no ${k}`);
    if (!p.best_for?.length) err(`${tag} palette ${p.id} has no best_for`);
    const keys = Object.keys(p.roles ?? {});
    if (keys.length !== ROLES.length || !ROLES.every((r) => /^#[0-9A-F]{6}$/i.test(p.roles[r] ?? ''))) { err(`${tag} palette ${p.id} must have exactly the roles ${ROLES.join(', ')} as 6-digit hex`); continue; }
    for (const [fg, bg, min] of ds.contrast_pairs ?? []) {
      const c = contrast(roleHex(p.roles, fg), roleHex(p.roles, bg));
      if (c < min) err(`${tag} palette ${p.id}: ${fg} on ${bg} is ${c.toFixed(2)}:1, needs ${min}:1`);
    }
    if (new Set(ROLES.map((r) => p.roles[r])).size < ROLES.length) err(`${tag} palette ${p.id} repeats a colour across roles`);
  }
  if (!(ds.contrast_pairs?.length >= 2) || !ds.contrast_pairs.some(([f, b]) => f === 'ink' && b === 'bg')) err(`${tag} contrast_pairs must include ink on bg`);
  // palettes must be genuinely distinct: no two share near-identical bg AND primary
  const ps = ds.palettes ?? [];
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++)
    if (dist(ps[i].roles.bg, ps[j].roles.bg) < 28 && dist(ps[i].roles.primary, ps[j].roles.primary) < 40) err(`${tag} palettes ${ps[i].id} and ${ps[j].id} are near-duplicates (bg and primary)`);
  const fids = new Set(), displays = new Set();
  for (const f of ds.fonts ?? []) {
    if (fids.has(f.id)) err(`${tag} duplicate pairing id ${f.id}`);
    fids.add(f.id);
    displays.add(f.display?.family);
    for (const r of FONT_ROLES) {
      const fr = f[r];
      if (!fr?.family) { err(`${tag} pairing ${f.id} has no ${r} role`); continue; }
      for (const k of ['weight', 'tracking', 'lineHeight']) if (typeof fr[k] !== 'number') err(`${tag} pairing ${f.id}.${r} has no numeric ${k}`);
      const info = fontInfo(fr.family);
      if (!info) { err(`${tag} pairing ${f.id}.${r}: "${fr.family}" is not in @remotion/google-fonts`); continue; }
      const st = fr.italic ? 'italic' : 'normal';
      if (!info.fonts?.[st]?.[String(fr.weight)]) err(`${tag} pairing ${f.id}.${r}: "${fr.family}" has no ${st} ${fr.weight} (has ${Object.keys(info.fonts?.[st] ?? {}).join(', ') || 'none'})`);
    }
  }
  if (displays.size < 8) err(`${tag} only ${displays.size} distinct display faces across 10 pairings (need 8+)`);
  const m = ds.motion ?? {};
  const ne = Object.keys(m.easings ?? {}).length;
  if (ne < 3 || ne > 5) err(`${tag} motion.easings needs 3-5 named curves, has ${ne}`);
  for (const [k, b] of Object.entries(m.easings ?? {})) if (!Array.isArray(b) || b.length !== 4 || b.some((v) => typeof v !== 'number')) err(`${tag} easing ${k} must be 4 numbers`);
  for (const k of ['fps', 'hold', 'enter_frames', 'stagger_frames', 'min_hold_frames']) if (typeof m[k] !== 'number') err(`${tag} motion.${k} missing`);
  if (!m.camera) err(`${tag} motion.camera missing`);
  for (const k of ['hero', 'h1', 'h2', 'body', 'label', 'numeral']) if (typeof ds.type_scale?.[k] !== 'number') err(`${tag} type_scale.${k} missing`);
  if (Object.keys(ds.textures ?? {}).length < 5) err(`${tag} textures needs 5+ parameter values`);
  if (ds.signature_moves?.length !== 5 || ds.signature_moves.some((s) => !s.name || (s.recipe ?? '').length < 60 || !/\d/.test(s.recipe))) err(`${tag} needs 5 signature moves, each with a numeric recipe`);
  if (!(ds.forbidden?.length >= 5)) err(`${tag} needs 5+ forbidden rules`);
  if (!ds.figure || !ds.composition?.anchors?.length) err(`${tag} figure / composition missing`);
}

function checkFilm(file) {
  const film = readJson(file);
  const d = film.design ?? {};
  let ds;
  try { ds = loadDS(d.style); } catch (e) { return err(e.message); }
  const pal = ds.palettes.find((p) => p.id === d.palette?.id);
  if (!pal) return err(`palette "${d.palette?.id}" is not one of the 10 in ${d.style}/design-system.json`);
  for (const r of ROLES) if ((d.palette.roles?.[r] ?? '').toUpperCase() !== pal.roles[r].toUpperCase()) err(`palette role ${r} was altered: ${d.palette.roles?.[r]} is not ${pal.roles[r]}`);
  const pair = ds.fonts.find((f) => f.id === d.fonts?.id);
  if (!pair) return err(`font pairing "${d.fonts?.id}" is not one of the 10 in ${d.style}/design-system.json`);
  for (const r of FONT_ROLES) if (d.fonts[r]?.family !== pair[r].family || d.fonts[r]?.weight !== pair[r].weight) err(`font role ${r} was altered: ${d.fonts[r]?.family} ${d.fonts[r]?.weight}`);
  // every colour anywhere in the render input (outside the embedded system) must be a palette colour
  const allowed = new Set(ROLES.map((r) => pal.roles[r].toUpperCase()));
  const families = new Set(FONT_ROLES.map((r) => pair[r].family));
  const scan = (v, where) => {
    if (typeof v === 'string') {
      for (const h of v.match(HEX) ?? []) if (!allowed.has(h.toUpperCase())) err(`${where}: colour ${h} is not in palette "${pal.id}"`);
      if (/rgba?\(|hsla?\(/i.test(v)) err(`${where}: raw rgb/hsl colour "${v.slice(0, 40)}"; use a palette role`);
    } else if (Array.isArray(v)) v.forEach((x, i) => scan(x, `${where}[${i}]`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) {
      if (/^(fontFamily|font|family)$/i.test(k) && typeof x === 'string' && !families.has(x)) err(`${where}.${k}: font "${x}" is not in pairing "${pair.id}"`);
      if (/^(fill|stroke|color|accent|role)$/.test(k) && typeof x === 'string' && x !== 'none' && !ROLES.includes(x) && !HEX.test(x)) err(`${where}.${k}: "${x}" is not a palette role`);
      scan(x, `${where}.${k}`);
    }
  };
  scan({meta: film.meta, cast: film.cast, scenes: film.scenes}, 'film');
  scan({palette: d.palette, fonts: d.fonts}, 'film.design');
  for (const [fg, bg, min] of ds.contrast_pairs) {
    const c = contrast(roleHex(pal.roles, fg), roleHex(pal.roles, bg));
    if (c < min) err(`contrast ${fg} on ${bg} is ${c.toFixed(2)}:1, needs ${min}:1`);
  }
}

const a = args();
if (a.systems) {
  const list = typeof a.systems === 'string' ? [a.systems] : listStyles();
  list.forEach(checkSystem);
  if (!errs.length) console.log(`PASS ${list.length} design system(s): 10 palettes, 10 pairings, contrast, fonts, motion`);
} else if (a._[0]) {
  checkFilm(a._[0]);
  if (!errs.length) console.log(`PASS ${a._[0]}: every colour and font is inside the chosen palette and pairing`);
} else { console.error('Usage: node check-design.js --systems [style] | <film.json>'); process.exit(2); }
if (errs.length) { errs.forEach((e) => console.error('FAIL ' + e)); process.exit(1); }
