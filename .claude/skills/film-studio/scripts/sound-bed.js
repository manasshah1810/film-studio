#!/usr/bin/env node
// Usage: node sound-bed.js <work-dir> [--bed-db -21] [--no-hits] [--no-sfx]
// The multi-layer cinema sound bed (personas/sound-designer.md section 3b). Everything is synthesized with
// ffmpeg (no downloads, no licences to track) and mixed under the narration into ONE track:
//   1. pulse bed     a dark low-frequency rhythmic pulse + brown-noise air, lowpassed, at --bed-db (default -21 dB
//                    LUFS), that drops to complete silence inside every [PAUSE] window (30 ms ramps, no clicks).
//   2. sub-bass hits a 95 -> 55 Hz drop with a long tail on the title slam (frame 0) and on every reveal: the
//                    first word after a pause, and the first word of a scene marked "impact": true.
//   3. transition    whooshes, UI ticks and stamp hits on audio-cues.json cues when the Sound Designer has
//      SFX          written them (else a whoosh on every scene cut), sidechain-ducked under the narrator.
// Reads work/voiceover-dry.wav (or voiceover.wav when no dry copy exists yet), work/voiceover-timing.json,
// work/script.json, work/audio-cues.json (optional). Writes work/voiceover.wav + work/voiceover.mp3 (the mix),
// work/audio/bed/*.wav (each layer, for inspection) and work/audio/mix.json (the layer log build-film.js reads).
// Run by generate-voiceover.js make, and again by the Sound Designer after audio-cues.json is written.
const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');
const {readJson, writeJson, args, fail} = require('./lib');

const a = args();
const work = a._[0];
if (!work) { console.error('Usage: node sound-bed.js <work-dir> [--bed-db -21] [--no-hits] [--no-sfx]'); process.exit(2); }
const J = (n) => path.join(work, n);
const ff = (argv) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...argv], {maxBuffer: 1 << 26});
const secs = (file) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());
const timing = fs.existsSync(J('voiceover-timing.json')) ? readJson(J('voiceover-timing.json')) : fail(`${J('voiceover-timing.json')} missing: run generate-voiceover.js make first`);
const dry = fs.existsSync(J('voiceover-dry.wav')) ? J('voiceover-dry.wav') : fs.existsSync(J('voiceover.wav')) ? J('voiceover.wav') : fail('no narration track (voiceover-dry.wav) in the work folder');
const script = readJson(J('script.json'));
const cues = fs.existsSync(J('audio-cues.json')) ? readJson(J('audio-cues.json')) : null;
const fps = timing.fps ?? script.fps ?? 30, T = secs(dry);
const dir = J(path.join('audio', 'bed'));
fs.mkdirSync(dir, {recursive: true});
const r3 = (x) => Math.round(x * 1000) / 1000;

// ---- pause windows (film seconds) and reveal moments
const windows = [], reveals = [{t: 0, why: 'title slam'}];
for (const c of timing.clips) {
  for (const p of c.pauses ?? []) windows.push([r3(c.start + p.at), r3(c.start + p.at + p.seconds)]);
  const sc = script.scenes.find((s) => s.id === c.scene);
  const segs = c.segments ?? [];
  // the word after a pause is the twist: the hit lands on it
  segs.forEach((s, i) => { if (i > 0) reveals.push({t: r3(c.start + s.start), why: `${c.scene} reveal after pause`}); });
  if (sc?.impact && !(segs.length > 1)) reveals.push({t: r3(c.start), why: `${c.scene} impact scene`});
}
const hits = a['no-hits'] ? [] : reveals.filter((h, i, arr) => !arr.slice(0, i).some((x) => Math.abs(x.t - h.t) < 1.2));

// ---- 1. pulse bed: 55 Hz + 110 Hz under a 2 Hz (120 BPM) pulse envelope, a minor-third drone and brown-noise air
const bedDb = Number(a['bed-db'] ?? -21);
const R = 0.03; // ramp seconds at each window edge
const gate = windows.length ? `1-max(0,${windows.map(([s, e]) => `clip(min((t-${s - R})/${R},(${e + R}-t)/${R}),0,1)`).reduce((x, y) => `max(${x},${y})`)})` : '1';
const pulse = `(0.55*sin(2*PI*55*t)+0.30*sin(2*PI*110*t)+0.18*sin(2*PI*65.4*t))*(0.35+0.65*pow(abs(sin(PI*2*t)),6))`;
ff(['-f', 'lavfi', '-i', `aevalsrc=${pulse}:s=44100:d=${T.toFixed(3)}`, '-f', 'lavfi', '-i', `anoisesrc=color=brown:amplitude=0.25:d=${T.toFixed(3)}:r=44100`,
  '-filter_complex', `[1]lowpass=f=180[n];[0][n]amix=inputs=2:normalize=0,lowpass=f=420,loudnorm=I=${bedDb}:TP=-3:LRA=7,volume='${gate}':eval=frame,afade=t=in:d=0.4[o]`, '-map', '[o]', '-ac', '1', '-ar', '44100', path.join(dir, 'bed.wav')]);

// ---- 2. sub-bass impact hits: 95 -> 55 Hz exponential drop, 1.6 s tail
ff(['-f', 'lavfi', '-i', `aevalsrc=0.95*sin(2*PI*(55*t+40*(1-exp(-8*t))/8))*exp(-2.6*t)*min(1,t/0.004):s=44100:d=1.6`, '-ac', '1', path.join(dir, 'kit-hit.wav')]);
// ---- 3. transition kit: whoosh (swept band of noise, peak at 0.30 s), tick (2.4 kHz click), stamp (noise snap + 120 Hz thump)
ff(['-f', 'lavfi', '-i', 'anoisesrc=color=pink:amplitude=0.9:d=0.45:r=44100', '-af', "bandpass=f=1400:w=1800,volume='pow(sin(PI*min(t/0.30,1)*0.5),2)*exp(-max(0,t-0.30)*14)':eval=frame", '-ac', '1', path.join(dir, 'kit-whoosh.wav')]);
ff(['-f', 'lavfi', '-i', 'aevalsrc=0.8*sin(2*PI*2400*t)*exp(-t*160):s=44100:d=0.05', '-ac', '1', path.join(dir, 'kit-tick.wav')]);
ff(['-f', 'lavfi', '-i', 'anoisesrc=color=white:amplitude=0.8:d=0.09:r=44100', '-f', 'lavfi', '-i', 'aevalsrc=0.9*sin(2*PI*120*t)*exp(-t*18):s=44100:d=0.35',
  '-filter_complex', "[0]highpass=f=900,volume='exp(-t*45)':eval=frame[s];[s][1]amix=inputs=2:normalize=0:duration=longest[o]", '-map', '[o]', '-ac', '1', path.join(dir, 'kit-stamp.wav')]);

// which kit sound a Sound Designer cue maps to (personas/sound-designer.md section 2 ids)
const KIT = (id) => (/whoosh|swell|flick|riser/.test(id) ? 'whoosh' : /sub-bass|impact/.test(id) ? 'hit' : /stamp|rip|zap|static/.test(id) ? 'stamp' : 'tick');
const PRE = {whoosh: 0.30, tick: 0, stamp: 0, hit: 0};
let sfxEvents = [];
if (!a['no-sfx']) {
  if (cues?.cues?.length) sfxEvents = cues.cues.map((c) => ({kit: KIT(c.sfx), t: c.frame / fps, why: c.peak ?? c.sfx}));
  else sfxEvents = timing.clips.slice(1).map((c) => ({kit: 'whoosh', t: c.start, why: `cut to ${c.scene}`}));
  // a Sound Designer sub-bass cue joins the hit layer instead of the SFX bus
  for (const e of sfxEvents.filter((x) => x.kit === 'hit')) if (!hits.some((h) => Math.abs(h.t - e.t) < 1.2)) hits.push({t: e.t, why: e.why});
  sfxEvents = sfxEvents.filter((e) => e.kit !== 'hit');
}
const at = (t, pre) => Math.max(0, Math.round((t - pre) * 1000));
const lay = (name, events, kitOf, gainDb) => {
  const out = path.join(dir, `${name}.wav`);
  if (!events.length) { ff(['-f', 'lavfi', '-i', `anullsrc=r=44100:cl=mono:d=${T.toFixed(3)}`, out]); return out; }
  const ins = events.flatMap((e) => ['-i', path.join(dir, `kit-${kitOf(e)}.wav`)]);
  const chains = events.map((e, i) => `[${i}]adelay=${at(e.t, PRE[kitOf(e)])}:all=1[d${i}]`).join(';');
  ff([...ins, '-filter_complex', `${chains};${events.map((_, i) => `[d${i}]`).join('')}amix=inputs=${events.length}:normalize=0,volume=${gainDb}dB,apad=whole_dur=${T.toFixed(3)},atrim=0:${T.toFixed(3)}[o]`, '-map', '[o]', '-ac', '1', '-ar', '44100', out]);
  return out;
};
const hitWav = lay('hits', hits, () => 'hit', -6);
const sfxWav = lay('sfx', sfxEvents, (e) => e.kit, -14);

// ---- the mix: SFX sidechain-ducked under the narrator, everything summed without normalisation, then a limiter
ff(['-i', dry, '-i', path.join(dir, 'bed.wav'), '-i', hitWav, '-i', sfxWav, '-filter_complex',
  '[0]asplit=2[vo][key];[3][key]sidechaincompress=threshold=0.02:ratio=8:attack=5:release=180[sd];[vo][1][2][sd]amix=inputs=4:normalize=0:duration=first,alimiter=limit=0.89[o]',
  '-map', '[o]', '-ar', '44100', '-ac', '1', J('voiceover.wav')]);
ff(['-i', J('voiceover.wav'), '-codec:a', 'libmp3lame', '-b:a', '192k', J('voiceover.mp3')]);
const layers = ['narration', `pulse bed ${bedDb} dB (silent in ${windows.length} pause window(s))`, `${hits.length} sub-bass hit(s) 95->55 Hz`, `${sfxEvents.length} transition sfx (sidechain-ducked)`];
writeJson(J(path.join('audio', 'mix.json')), {file: 'voiceover.mp3', seconds: r3(secs(J('voiceover.wav'))), fps, layers, bed_db: bedDb, pause_windows: windows, hits, sfx: sfxEvents.map((e) => ({...e, t: r3(e.t)}))});
console.log(`PASS sound bed: ${layers.join('; ')}. Wrote ${J('voiceover.mp3')} and audio/mix.json.`);
