#!/usr/bin/env node
// Usage:
//   node stills.js --film work/film.json --panels s1p1,s3p2 [--at 0.85] [--scale 0.4] [--out work/stills]
//   node stills.js --film work/film.json --all            one still per panel
//   node stills.js --film work/film.json --sheet [--cols 5] [--cell 360]   one contact sheet of every panel
//   node stills.js --comp Baseline-nokia --frames 60,400 --out baseline
// Bundles once, then renders low-resolution PNG stills. Never renders video.
const fs = require('fs');
const path = require('path');
const {COMPONENTS, creq, readJson, args, fail} = require('./lib');

(async () => {
  const a = args();
  const {bundle} = creq('@remotion/bundler');
  const {renderStill, selectComposition} = creq('@remotion/renderer');
  const out = path.resolve(a.out ?? 'stills');
  fs.mkdirSync(out, {recursive: true});
  const scale = Number(a.scale ?? (a.sheet ? 1 : 0.4));
  const serveUrl = await bundle({entryPoint: path.join(COMPONENTS, 'entry.ts'), publicDir: a.public ? path.resolve(a.public) : undefined});
  const jobs = [];
  let inputProps = {}, id = a.comp ?? 'Film';
  if (a.sheet) {
    inputProps = {...readJson(a.film), sheet: {cols: a.cols ? Number(a.cols) : undefined, cell: a.cell ? Number(a.cell) : undefined, at: a.at ? Number(a.at) : undefined}};
    id = 'Sheet';
    jobs.push({frame: 0, name: `${a.prefix ?? ''}sheet.png`});
  } else if (a.film) {
    const film = readJson(a.film);
    inputProps = film;
    const at = Number(a.at ?? 0.85);
    let f = 0;
    const want = a.all ? null : new Set(String(a.panels ?? '').split(',').filter(Boolean));
    for (const sc of film.scenes) for (const p of sc.panels) {
      const d = Math.max(1, Math.round(p.duration * film.meta.fps));
      if (!want || want.has(p.id)) jobs.push({frame: f + Math.min(d - 1, Math.round(d * at)), name: `${a.prefix ?? ''}${p.id}.png`});
      f += d;
    }
    if (want && jobs.length !== want.size) fail(`some panel ids not found: ${[...want].join(',')}`);
  } else for (const fr of String(a.frames ?? '0').split(',')) jobs.push({frame: Number(fr), name: `${a.prefix ?? id + '-'}${fr}.png`});
  const composition = await selectComposition({serveUrl, id, inputProps});
  for (const j of jobs) {
    await renderStill({composition, serveUrl, output: path.join(out, j.name), frame: j.frame, inputProps, scale, chromiumOptions: {gl: a.gl ?? 'angle'}});
    console.log(`still ${path.join(out, j.name)} (frame ${j.frame})`);
  }
  console.log(`PASS ${jobs.length} still(s) at scale ${scale}`);
})().catch((e) => { console.error('FAIL ' + (e && e.message ? e.message : e)); process.exit(1); });
