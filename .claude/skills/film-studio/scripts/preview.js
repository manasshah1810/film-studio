#!/usr/bin/env node
// Usage: node preview.js <style> [--palette id] [--pairing id] [--platform instagram] [--panels hero,figure | --all] (default: one contact sheet) [--scale 0.3] [--out dir]
// Renders the style specimen (library/preview.json) as low-resolution stills. Proves a kit; never renders video.
const fs = require('fs');
const os = require('os');
const path = require('path');
const {execFileSync} = require('child_process');
const {SKILL, readJson, writeJson, loadDS, args} = require('./lib');

const a = args();
const style = a._[0];
if (!style) { console.error('Usage: node preview.js <style> [--palette id] [--pairing id] [--platform p] [--panels a,b] [--scale 0.3] [--out dir]'); process.exit(2); }
const ds = loadDS(style);
const palette = a.palette ?? ds.palettes[0].id, pairing = a.pairing ?? ds.fonts[0].id;
const spec = readJson(path.join(SKILL, 'library', 'preview.json'));
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-preview-'));
writeJson(path.join(work, 'brief.json'), {topic: `${style} specimen`, platform: a.platform ?? 'instagram', length_bucket: '30-1m', style, voiceover: false, design: {palette_id: palette, pairing_id: pairing, seed: a.seed ?? 'specimen'}});
writeJson(path.join(work, 'cast.json'), spec.cast);
writeJson(path.join(work, 'storyboard.json'), spec.storyboard);
const run = (s, ...rest) => execFileSync(process.execPath, [path.join(__dirname, s), ...rest], {stdio: 'inherit'});
run('build-film.js', work);
const out = a.out ?? path.join(SKILL, '..', '..', '..', 'previews', style);
run('stills.js', '--film', path.join(work, 'film.json'), ...(a.panels ? ['--panels', a.panels, '--scale', String(a.scale ?? 0.3)] : a.all ? ['--all', '--scale', String(a.scale ?? 0.3)] : ['--sheet', ...(a.cell ? ['--cell', String(a.cell)] : [])]), '--prefix', `${palette}-`, '--out', out);
fs.rmSync(work, {recursive: true, force: true});
