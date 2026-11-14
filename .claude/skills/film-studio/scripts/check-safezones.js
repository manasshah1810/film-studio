#!/usr/bin/env node
// Usage: node check-safezones.js <work-dir | film.json | storyboard.json> [--ratio 9:16]
// Zero tokens: run it, do not read it. Exit 0 = PASS, 1 = FAIL (each line says what to change).
//
// On a 9:16 frame the platform UI covers the bottom 20% (caption, audio, progress bar) and the
// right 15% (like, comment, share). No text and no face may enter either band.
//   A box is {kind, x, y, w, h} in PERCENT of the frame, origin top-left.
//   Checked: kind "text", "caption", "face", and any box or widget that carries "text".
//   Limits: y + h <= 80 and x + w <= 85. Other ratios are not checked (PASS with a note).
const {args} = require('./lib');
const {load, boxesOf, isText, captionsOf} = require('./plan');

const BOTTOM = 80, RIGHT = 85; // percent of the frame that stays usable
const r1 = (n) => Math.round(n * 10) / 10;

function checkSafe(P) {
  const E = [];
  if (P.ratio !== '9:16') return E;
  if (!P.panels.length) return ['no panels found'];
  for (const p of P.panels) {
    const boxes = boxesOf(p);
    if (!boxes.length) { E.push(`${p.id}: no "boxes", so the safe zones cannot be proved. Fix: give every text and face a box {id, kind, x, y, w, h} in percent of the frame.`); continue; }
    if (captionsOf(p).length && !boxes.some((b) => b.kind === 'caption')) E.push(`${p.id}: has captions but no box of kind "caption". Fix: add one, e.g. {"id": "cap", "kind": "caption", "x": 8, "y": 68, "w": 74, "h": 8}.`);
    for (const b of boxes) {
      const tag = `${p.id} box "${b.id ?? '?'}" (${b.kind ?? 'text'})`;
      if (![b.x, b.y, b.w, b.h].every((n) => typeof n === 'number')) { E.push(`${tag}: needs numeric x, y, w, h in percent`); continue; }
      if (b.x < 0 || b.y < 0 || b.w <= 0 || b.h <= 0 || b.x + b.w > 100 || b.y + b.h > 100) E.push(`${tag}: runs outside the frame (x ${b.x}, y ${b.y}, w ${b.w}, h ${b.h})`);
      if (!(isText(b) || b.kind === 'face')) continue;
      if (b.y + b.h > BOTTOM) E.push(`${tag}: ends at y ${r1(b.y + b.h)}; the bottom 20% is platform UI (limit ${BOTTOM}). Fix: set y to ${r1(BOTTOM - b.h)} or less${b.h > BOTTOM ? ', and shrink h' : ''}.`);
      if (b.x + b.w > RIGHT) E.push(`${tag}: ends at x ${r1(b.x + b.w)}; the right 15% is platform UI (limit ${RIGHT}). Fix: set x to ${r1(Math.max(0, RIGHT - b.w))} or less${b.w > RIGHT ? `, and w to ${RIGHT} or less` : ''}.`);
    }
  }
  return E;
}

module.exports = {checkSafe, BOTTOM, RIGHT};

if (require.main === module) {
  const a = args();
  if (!a._[0]) { console.error('Usage: node check-safezones.js <work-dir | film.json | storyboard.json> [--ratio 9:16]'); process.exit(2); }
  const P = load(a._[0], {ratio: typeof a.ratio === 'string' ? a.ratio : undefined});
  if (P.ratio !== '9:16') { console.log(`PASS safe zones: frame is ${P.ratio}, the 9:16 bands do not apply`); process.exit(0); }
  const E = checkSafe(P);
  if (E.length) { E.forEach((e) => console.error('FAIL ' + e)); console.error(`${E.length} problem(s)`); process.exit(1); }
  console.log(`PASS safe zones: ${P.panels.length} panels keep text and faces out of the bottom 20% and right 15%`);
}
