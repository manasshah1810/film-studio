#!/usr/bin/env node
// Usage:
//   node render.js <work-dir> --draft [--from 0 --seconds 3]    low-resolution check (scale 0.33, no audio mux beyond the film's own)
//   node render.js <work-dir> --final                            full resolution, H.264 MP4
// Renders work/film.json (make it with build-film.js) through the one `Film` composition.
// One attempt only: on any failure this prints the error and exits 1. It never retries.
const fs = require('fs');
const path = require('path');
const {COMPONENTS, creq, readJson, args, fail} = require('./lib');

(async () => {
  const a = args(), work = a._[0];
  if (!work || (!a.draft && !a.final)) { console.error('Usage: node render.js <work-dir> --draft [--from s --seconds n] | --final'); process.exit(2); }
  const fp = path.join(work, 'film.json');
  if (!fs.existsSync(fp)) fail(`${fp} missing; run build-film.js ${work}`);
  const film = readJson(fp);
  const budget = path.join(work, 'budget.json');
  if (fs.existsSync(budget) && !readJson(budget).approved) fail('budget is not approved; nothing may be rendered yet');
  const {bundle} = creq('@remotion/bundler');
  const {renderMedia, selectComposition} = creq('@remotion/renderer');
  const serveUrl = await bundle({entryPoint: path.join(COMPONENTS, 'entry.ts'), publicDir: path.resolve(work)});
  const composition = await selectComposition({serveUrl, id: 'Film', inputProps: film});
  const fps = film.meta.fps, total = composition.durationInFrames;
  const from = a.draft ? Math.round(Number(a.from ?? 0) * fps) : 0;
  const to = a.draft ? Math.min(total - 1, from + Math.round(Number(a.seconds ?? 3) * fps) - 1) : total - 1;
  const out = path.join(work, 'out', a.draft ? 'draft.mp4' : 'final.mp4');
  fs.mkdirSync(path.dirname(out), {recursive: true});
  await renderMedia({composition, serveUrl, codec: 'h264', outputLocation: out, inputProps: film, frameRange: [from, to], scale: a.draft ? 0.33 : 1, chromiumOptions: {gl: a.gl ?? 'angle'}});
  console.log(`PASS ${out}: frames ${from}-${to} of ${total} at ${a.draft ? 'draft' : 'full'} resolution. Next: node check-render.js ${work} ${a.draft ? '--draft' : '--final'}`);
})().catch((e) => { console.error('FAIL render: ' + (e && e.message ? e.message : e)); console.error('Stop and report this to the user. Do not retry in a loop.'); process.exit(1); });
