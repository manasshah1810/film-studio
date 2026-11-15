#!/usr/bin/env node
// Usage:
//   node stills.js --manifest work/render-manifest.json --panels s1p1,s3p2 [--at 0.85] [--scale 0.4] [--out work/stills] [--safe-zones]
//   node stills.js --manifest work/render-manifest.json --all            one still per panel
//   node stills.js --comp Baseline-nokia --frames 60,400 --out baseline   any other composition
// FS_BROWSER (optional env) points at a local Chrome or headless shell when Remotion cannot download its own.
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
  const scale = Number(a.scale ?? 0.4);
  const serveUrl = await bundle({entryPoint: path.join(COMPONENTS, 'entry.ts'), publicDir: a.public ? path.resolve(a.public) : a.manifest ? path.dirname(path.resolve(a.manifest)) : undefined});
  const jobs = [];
  let inputProps = {}, id = a.comp ?? 'FilmComposition';
  if (a.manifest) {
    const man = readJson(a.manifest);
    inputProps = {...man, showSafeZones: !!a['safe-zones']};
    const at = Number(a.at ?? 0.85);
    const want = a.all ? null : new Set(String(a.panels ?? '').split(',').filter(Boolean));
    for (const p of man.panels) if (!want || want.has(p.id)) jobs.push({frame: p.from + Math.min(p.frames - 1, Math.round(p.frames * at)), name: `${a.prefix ?? ''}${p.id}.png`});
    if (want && jobs.length !== want.size) fail(`some panel ids not found: ${[...want].join(',')}`);
  } else for (const fr of String(a.frames ?? '0').split(',')) jobs.push({frame: Number(fr), name: `${a.prefix ?? id + '-'}${fr}.png`});
  const composition = await selectComposition({serveUrl, id, inputProps, browserExecutable: process.env.FS_BROWSER || null});
  for (const j of jobs) {
    await renderStill({composition, serveUrl, output: path.join(out, j.name), frame: j.frame, inputProps, scale, chromiumOptions: {gl: a.gl ?? 'angle'}, browserExecutable: process.env.FS_BROWSER || null});
    console.log(`still ${path.join(out, j.name)} (frame ${j.frame})`);
  }
  console.log(`PASS ${jobs.length} still(s) at scale ${scale}`);
})().catch((e) => { console.error('FAIL ' + (e && e.message ? e.message : e)); process.exit(1); });
