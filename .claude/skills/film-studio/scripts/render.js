#!/usr/bin/env node
// Usage:
//   node render.js <work-dir> --pass 1 [--from 0 --seconds 3]   review render: half resolution, safe-zone overlay ON -> out/pass1.mp4
//   node render.js <work-dir> --pass 2                          polish render: full resolution, overlay OFF        -> out/final.mp4
// Renders work/render-manifest.json (make it with build-film.js) through the one `FilmComposition`.
// Pass 1 is what run-all-checks.js and the QA Inspector judge; Pass 2 runs only after their fixes.
// FS_BROWSER (optional env) points at a local Chrome or headless shell when Remotion cannot download its own.
// One attempt only: on any failure this prints the error and exits 1. It never retries.
const fs = require('fs');
const path = require('path');
const {COMPONENTS, creq, readJson, args, fail} = require('./lib');

(async () => {
  const a = args(), work = a._[0], pass = Number(a.pass);
  if (!work || ![1, 2].includes(pass)) { console.error('Usage: node render.js <work-dir> --pass 1 [--from s --seconds n] | --pass 2'); process.exit(2); }
  const fp = path.join(work, 'render-manifest.json');
  if (!fs.existsSync(fp)) fail(`${fp} missing; run build-film.js ${work}`);
  const manifest = {...readJson(fp), showSafeZones: pass === 1};
  const budget = path.join(work, 'budget.json');
  if (fs.existsSync(budget) && !readJson(budget).approved) fail('budget is not approved; nothing may be rendered yet');
  const {bundle} = creq('@remotion/bundler');
  const {renderMedia, selectComposition} = creq('@remotion/renderer');
  const serveUrl = await bundle({entryPoint: path.join(COMPONENTS, 'entry.ts'), publicDir: path.resolve(work)});
  const composition = await selectComposition({serveUrl, id: 'FilmComposition', inputProps: manifest, browserExecutable: process.env.FS_BROWSER || null});
  const fps = manifest.meta.fps, total = composition.durationInFrames;
  const from = a.from !== undefined ? Math.round(Number(a.from) * fps) : 0;
  const to = a.seconds !== undefined ? Math.min(total - 1, from + Math.round(Number(a.seconds) * fps) - 1) : total - 1;
  const out = path.join(work, 'out', pass === 1 ? 'pass1.mp4' : 'final.mp4');
  fs.mkdirSync(path.dirname(out), {recursive: true});
  await renderMedia({composition, serveUrl, codec: 'h264', outputLocation: out, inputProps: manifest, frameRange: [from, to], scale: pass === 1 ? 0.5 : 1, chromiumOptions: {gl: a.gl ?? 'angle'}, browserExecutable: process.env.FS_BROWSER || null});
  console.log(`PASS ${out}: frames ${from}-${to} of ${total}, pass ${pass}${pass === 1 ? ' (half size, safe zones shown)' : ''}. Next: node scripts/check-render.js ${work} --pass ${pass}`);
})().catch((e) => { console.error('FAIL render: ' + (e && e.message ? e.message : e)); console.error('Stop and report this to the user. Do not retry in a loop.'); process.exit(1); });
