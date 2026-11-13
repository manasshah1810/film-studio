#!/usr/bin/env node
// Usage: node cast-sheet.js <work-dir>
// Renders every cast asset (approved or not) on one low-resolution sheet: work/stills/cast-sheet.png.
// Characters are shown twice (idle, and acting) so reviewers can judge silhouette and range. Stills only.
const fs = require('fs');
const os = require('os');
const path = require('path');
const {execFileSync} = require('child_process');
const {readJson, writeJson, args, fail} = require('./lib');

const work = args()._[0];
if (!work) { console.error('Usage: node cast-sheet.js <work-dir>'); process.exit(2); }
for (const f of ['brief.json', 'cast.json']) if (!fs.existsSync(path.join(work, f))) fail(`${path.join(work, f)} missing`);
const cast = readJson(path.join(work, 'cast.json'));
const chars = cast.assets.filter((a) => a.def.kind === 'character'), props = cast.assets.filter((a) => a.def.kind === 'prop');
if (!chars.length && !props.length) fail('cast.json has no characters or props to draw');
const panels = [];
const ACT = [['cheer', 'happy'], ['slump', 'sad'], ['point', 'smug'], ['shrug', 'worried']];
chars.forEach((c, i) => {
  panels.push({id: `s1p${panels.length + 1}`, duration: 3, layout: 'figure', energy: 'calm', asset_ids: [c.id], slots: {headline: c.id, cast: [{id: c.id, pose: 'idle', expr: 'neutral'}]}});
  panels.push({id: `s1p${panels.length + 1}`, duration: 3, layout: 'figure', energy: 'build', asset_ids: [c.id], slots: {headline: `${c.id} acting`, cast: [{id: c.id, pose: ACT[i % 4][0], expr: ACT[i % 4][1]}]}});
});
for (let i = 0; i + 1 < chars.length; i += 2) panels.push({id: `s1p${panels.length + 1}`, duration: 3, layout: 'figure', energy: 'build', asset_ids: [chars[i].id, chars[i + 1].id], slots: {headline: 'Together', cast: [{id: chars[i].id, pose: 'point', expr: 'happy'}, {id: chars[i + 1].id, pose: 'shrug', expr: 'worried', flip: true}]}});
for (const p of props) panels.push({id: `s1p${panels.length + 1}`, duration: 3, layout: 'object', energy: 'calm', asset_ids: [p.id], slots: {headline: p.id, prop: {id: p.id}}});
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-cast-'));
try {
  writeJson(path.join(tmp, 'brief.json'), {...readJson(path.join(work, 'brief.json')), voiceover: false});
  writeJson(path.join(tmp, 'cast.json'), {assets: cast.assets.map((a) => ({...a, approved: true}))}); // sheet only; approval is unchanged in work/
  writeJson(path.join(tmp, 'storyboard.json'), {scenes: [{id: 's1', panels: panels.map((p) => ({...p, caption: ''}))}]});
  const run = (s, ...rest) => execFileSync(process.execPath, [path.join(__dirname, s), ...rest], {stdio: 'inherit'});
  run('build-film.js', tmp);
  run('stills.js', '--film', path.join(tmp, 'film.json'), '--sheet', '--cols', String(Math.min(panels.length, 5)), '--prefix', 'cast-', '--out', path.join(work, 'stills'));
  console.log(`PASS ${path.join(work, 'stills', 'cast-sheet.png')}: ${chars.length} character(s), ${props.length} prop(s)`);
} catch (e) {
  fail(`cast sheet failed: ${e.message.split('\n')[0]}. Stop and report; do not retry in a loop.`);
} finally { fs.rmSync(tmp, {recursive: true, force: true}); }
