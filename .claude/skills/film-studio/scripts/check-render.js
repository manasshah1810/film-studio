#!/usr/bin/env node
// Usage: node check-render.js <work-dir> --pass 1|2 [--file path.mp4]
// Measures the rendered file with ffprobe and compares it with render-manifest.json and the platform preset.
// Checks: it exists and is not empty, size, frame rate, duration, audio stream when a voice was made,
// file size against the platform limit, and that no frame sample is a single flat colour.
const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');
const {SKILL, readJson, args, fail} = require('./lib');

const a = args(), work = a._[0];
const pass = Number(a.pass);
if (!work || ![1, 2].includes(pass)) { console.error('Usage: node check-render.js <work-dir> --pass 1|2 [--file path.mp4]'); process.exit(2); }
const film = readJson(path.join(work, 'render-manifest.json'));
const file = a.file ?? path.join(work, 'out', pass === 1 ? 'pass1.mp4' : 'final.mp4');
const full = pass === 2;
if (!fs.existsSync(file) || fs.statSync(file).size < 1000) fail(`${file} is missing or empty`);
let probe;
try { probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]).toString()); } catch (e) { fail(`ffprobe could not read ${file}: ${e.message}`); }
const v = probe.streams.find((s) => s.codec_type === 'video'), au = probe.streams.find((s) => s.codec_type === 'audio');
const E = [], W = [];
if (!v) fail('no video stream');
const scale = pass === 1 ? 0.5 : 1, m = film.meta;
const even = (n) => Math.round((n * scale) / 2) * 2;
if (Math.abs(v.width - even(m.width)) > 2 || Math.abs(v.height - even(m.height)) > 2) E.push(`size is ${v.width}x${v.height}; expected ${even(m.width)}x${even(m.height)} (${m.ratio})`);
const [fn, fd] = v.r_frame_rate.split('/').map(Number);
if (Math.abs(fn / fd - m.fps) > 0.01) E.push(`frame rate is ${(fn / fd).toFixed(2)}; the style runs at ${m.fps}`);
const want = m.frames / m.fps;
const dur = Number(probe.format.duration);
if (full && Math.abs(dur - want) > 0.2) E.push(`duration is ${dur.toFixed(2)} s; render-manifest.json says ${want.toFixed(2)} s`);
const hasAudio = (film.audio?.voiceover?.clips ?? []).length || film.audio?.music || (film.audio?.sfx ?? []).some((c) => c.file);
if (full && hasAudio && !au) E.push('render-manifest.json has audio but the file has no audio stream');
if (v.codec_name !== 'h264') W.push(`codec is ${v.codec_name}; platforms expect h264`);
if (v.pix_fmt && v.pix_fmt !== 'yuv420p') W.push(`pixel format is ${v.pix_fmt}; yuv420p plays everywhere`);
const pf = readJson(path.join(SKILL, 'library', 'platforms.json'))[m.platform];
const mb = fs.statSync(file).size / 1e6;
if (full && pf && mb > pf.max_file_mb) E.push(`file is ${mb.toFixed(0)} MB; ${m.platform} allows ${pf.max_file_mb} MB [CHECK]`);
// a blank render: sample three frames and look at the spread of the luma plane
try {
  const out = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', `select='not(mod(n\\,${Math.max(1, Math.floor((dur * m.fps) / 3))}))',signalstats,metadata=print:file=-`, '-frames:v', '3', '-f', 'null', '-'], {stdio: ['ignore', 'pipe', 'ignore']}).toString();
  const lo = [...out.matchAll(/YMIN=(\d+)/g)].map((x) => Number(x[1])), hi = [...out.matchAll(/YMAX=(\d+)/g)].map((x) => Number(x[1]));
  if (lo.length && lo.every((l, i) => hi[i] - l < 8)) E.push('every sampled frame is one flat colour: the render is blank');
} catch (e) { W.push('could not sample frames for the blank check'); }
W.forEach((w) => console.log('WARN ' + w));
if (E.length) fail(E.join('\nFAIL '));
console.log(`PASS ${file}: ${v.width}x${v.height}, ${(fn / fd).toFixed(0)} fps, ${dur.toFixed(2)} s, ${mb.toFixed(1)} MB${au ? ', audio' : ', no audio'}`);
