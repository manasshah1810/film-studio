#!/usr/bin/env node
// Usage:
//   node generate-voiceover.js models                                   list the Gemini TTS models this key can reach
//   node generate-voiceover.js sample --text "<one sentence>" --out <file.wav> [--voice Charon]
//   node generate-voiceover.js verify <file.wav> --text "<expected words>"   transcribe a clip and compare (QA)
//   node generate-voiceover.js make <work-dir> [--voice Charon] [--pause 0.15] [--tag "[fast, urgent]"] [--style "<direction>"] [--retime] [--no-verify] [--no-mix]
// Google AI Studio (Gemini API) text-to-speech. The default voiceover provider whenever GEMINI_API_KEY is set.
//   make    one clip per script scene, each transcribed back and compared to its narration (one regeneration
//           on a mismatch, then stop): Gemini returns raw PCM (audio/L16), ffmpeg turns it into a trimmed,
//           loudness-matched 44.1 kHz mono wav + mp3 in work/audio/, and the clips are merged with `--pause`
//           seconds of air into work/voiceover-dry.wav. ffprobe measures every clip into work/voiceover-timing.json
//           and work/audio/manifest.json (the file build-film.js reads). Then scripts/sound-bed.js mixes the
//           3-layer bed (pulse bed, sub-bass hits, transition SFX) under it into work/voiceover.wav + .mp3.
//   Per-beat pause stitching: a narration is cut at its [PAUSE 0.6s] / [PAUSE 0.9s] markers; each beat is
//           spoken on its own and the beats are joined with exactly that much silence, so a twist breathes.
//   Performance: every beat is read under DIRECTION (a charismatic documentary storyteller), --style overrides.
//   --retime  makes the voice the clock: each scene lasts exactly its clip + pause (to the frame), and
//           script.json (starts, durations, caption chunks), storyboard.json (panel durations, beat/widget/
//           bespoke/sfx times), widgets.json, motion.json, vfx-plan.json and audio-cues.json (music cuts,
//           voice segments for ducking) are rescaled scene by scene. brief.json gets voiceover: true.
// Models: tried in MODELS order, then any other "*tts*" model the key lists; the first that answers wins.
// Voices: --voice first, then VOICES. A failure moves on to the next option once; when all fail it stops.
// The key is read from the environment or .env (project root) and is never printed, logged or written.
const fs = require('fs');
const os = require('os');
const path = require('path');
const {execFileSync} = require('child_process');
const {readJson, writeJson, args, fail} = require('./lib');

const API = 'https://generativelanguage.googleapis.com/v1beta';
const MODELS = ['gemini-3.8-flash-tts', 'gemini-3.1-flash-tts-preview', 'gemini-2.5-pro-preview-tts', 'gemini-2.5-flash-preview-tts'];
const VOICES = ['Charon', 'Fenrir', 'Orus', 'Alnilam'];
// Delivery: an inline tag ahead of the line. Tested 2026-11-15 on one 14-word line: "[fast, urgent]" 3.75 s,
// "[energetic, brisk]" 5.4 s, plain 5.8-6.8 s, and a long natural-language direction 11.4 s (the model slows
// down to "perform" it). --style "<direction>" still works for a slower, acted read.
// Expressive read (personas/sound-designer.md section 3a). The verify step catches a model that reads it aloud.
const DIRECTION = 'Speak like a charismatic, high-energy documentary storyteller: build genuine curiosity on questions, pick up pace during tense build-ups, hit numbers and twists with sharp emphasis, and honor natural dramatic pauses. Never sound flat or robotic. Read only the quoted words';
const TAG = '';
// the fallback when a model loops or drags under the long direction: a short inline delivery tag
const COMPACT = '[energetic, curious documentary storyteller; sharp on numbers and twists]';
const STYLE = DIRECTION;
const a = args();
const [cmd, work] = a._;

const loadEnv = () => {
  for (const p of [path.join(process.cwd(), '.env'), work ? path.join(work, '..', '..', '.env') : '', path.join(__dirname, '..', '..', '..', '..', '.env')]) {
    if (!p || !fs.existsSync(p)) continue;
    for (const l of fs.readFileSync(p, 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*"?([^"#]*)"?\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim(); }
  }
};
const key = () => process.env.GEMINI_API_KEY || fail('GEMINI_API_KEY is not set. Put it in the project .env (listed in .gitignore) or the shell; never in a tracked file.');
const ff = (argv) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...argv]);
const secs = (file) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());

async function listTts() {
  const r = await fetch(`${API}/models?pageSize=200`, {headers: {'x-goog-api-key': key()}});
  if (!r.ok) return [];
  return ((await r.json()).models ?? []).map((m) => m.name.replace(/^models\//, '')).filter((n) => /tts/.test(n));
}

const dead = new Set(); // models that answered 429 with a long wait in this run
let chosen = null; // the first model + voice that worked is reused for every later clip
/** text -> {pcm: Buffer, rate, model, voice}. Falls back across models and voices; never retries the same pair. */
async function tts(text, voice, style, tag = TAG) {
  if (tag) text = `${tag} ${text}`;
  const listed = await listTts();
  // the pair that already worked goes first so every clip keeps one voice; the rest stay as fallbacks
  const models = [...new Set([chosen?.model, ...MODELS.filter((m) => !listed.length || listed.includes(m)), ...listed].filter(Boolean))];
  const voices = [...new Set([chosen?.voice, voice, ...VOICES].filter(Boolean))];
  const errs = [];
  // one narrator voice for the whole film: models are tried before voices. A 429 (quota) waits once for a short
  // retryDelay (25 s at most); a longer one marks the model spent for this run and falls through to the next.
  for (const v of voices) for (const model of models.filter((x) => !dead.has(x))) {
    const body = {contents: [{parts: [{text: style ? `${style}: "${text}"` : text}]}], generationConfig: {responseModalities: ['AUDIO'], speechConfig: {voiceConfig: {prebuiltVoiceConfig: {voiceName: v}}}}};
    let r, waits = 0;
    for (;;) {
      try { r = await fetch(`${API}/models/${model}:generateContent`, {signal: AbortSignal.timeout(90000), method: 'POST', headers: {'x-goog-api-key': key(), 'content-type': 'application/json'}, body: JSON.stringify(body)}); } catch (e) { r = null; errs.push(`${model}/${v}: ${e.message}`); break; }
      if (r.status !== 429 || waits >= 1) break;
      const j = await r.clone().json().catch(() => ({}));
      const delay = Number(String((j.error?.details ?? []).find((d) => d.retryDelay)?.retryDelay ?? '20s').replace(/s$/, '')) + 2;
      if (delay > 25 || dead.has(model)) { dead.add(model); break; } // a long quota wait: fall through to the next model now
      waits++;
      console.error(`note ${model}/${v}: quota (429), waiting ${delay} s once`);
      await new Promise((res) => setTimeout(res, delay * 1000));
    }
    if (!r) continue;
    if (!r.ok) { const j = await r.json().catch(() => ({})); errs.push(`${model}/${v}: HTTP ${r.status} ${String(j.error?.message ?? '').slice(0, 120)}`); continue; }
    const part = ((await r.json()).candidates?.[0]?.content?.parts ?? []).find((p) => p.inlineData?.data);
    if (!part) { errs.push(`${model}/${v}: no audio in the response`); continue; }
    if (errs.length) console.error(`note fell back to ${model}/${v} after: ${errs.join('; ')}`);
    const mime = part.inlineData.mimeType ?? '';
    chosen = {model, voice: v};
    return {data: Buffer.from(part.inlineData.data, 'base64'), mime, rate: Number((mime.match(/rate=(\d+)/) ?? [])[1] ?? 24000), model, voice: v};
  }
  fail(`no Gemini TTS model answered. Stop and report; do not retry in a loop.\n  ${errs.join('\n  ')}`);
}

/** Raw PCM (audio/L16) or an encoded container -> trimmed, loudness-matched 44.1 kHz mono wav and mp3. */
function encode(au, base) {
  const tmp = path.join(os.tmpdir(), `fs-vo-${process.pid}-${path.basename(base)}`);
  const pcm = /L16|pcm/i.test(au.mime) || !au.mime;
  fs.writeFileSync(tmp, au.data);
  const input = pcm ? ['-f', 's16le', '-ar', String(au.rate), '-ac', '1', '-i', tmp] : ['-i', tmp];
  const trim = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,areverse';
  ff([...input, '-af', `${trim},loudnorm=I=-16:TP=-1.5:LRA=9`, '-ar', '44100', '-ac', '1', `${base}.wav`]);
  ff(['-i', `${base}.wav`, '-codec:a', 'libmp3lame', '-b:a', '192k', `${base}.mp3`]);
  fs.unlinkSync(tmp);
  return secs(`${base}.wav`);
}

const TRANSCRIBE = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.1-flash-lite']; // fast; full flash models think for minutes
// numbers may come back as digits ("$4 billion" for "four billion dollars"), so number words, digits and
// currency words are left out of the comparison
const NUMW = /^(\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thousand|hundred|dollars?)$/;
const norm = (x) => String(x).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w && !NUMW.test(w));
/** Transcribe a clip with a Gemini text model and score it against the expected words: catches a voice that
 * reads the style direction aloud, skips words or adds its own. */
async function verify(file, expected) {
  const audio = fs.readFileSync(file).toString('base64');
  for (const model of TRANSCRIBE) {
    let r;
    try { r = await fetch(`${API}/models/${model}:generateContent`, {signal: AbortSignal.timeout(60000), method: 'POST', headers: {'x-goog-api-key': key(), 'content-type': 'application/json'}, body: JSON.stringify({contents: [{parts: [{inlineData: {mimeType: 'audio/wav', data: audio}}, {text: 'Transcribe this speech verbatim. Output only the words spoken.'}]}]})}); } catch (e) { continue; }
    if (!r.ok) continue;
    const said = ((await r.json()).candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join(' ').trim();
    const e = norm(expected), w = norm(said), hit = e.filter((x) => w.includes(x)).length;
    return {said, recall: hit / Math.max(1, e.length), extra: Math.max(0, w.length - e.length)};
  }
  return null;
}

const fpsOf = (work) => readJson(path.join(work, 'script.json')).fps ?? 30;

/** Rescale every plan file so scene i lasts `dur[i]` seconds. `map(t)` moves an old film time to the new one. */
function retime(work, timing, fps) {
  const J = (n) => path.join(work, n), opt = (n) => (fs.existsSync(J(n)) ? readJson(J(n)) : null);
  const script = readJson(J('script.json'));
  const old = script.scenes.map((s) => ({id: s.id, start: s.start, dur: s.duration}));
  const neu = [];
  let t = 0;
  for (const s of script.scenes) { const c = timing.clips.find((x) => x.scene === s.id); const fr = Math.ceil(((c ? c.seconds : s.duration) + (c ? timing.pause : 0)) * fps - 0.001); neu.push({id: s.id, start: t, dur: fr / fps, speech: c ? c.seconds : 0, k: fr / fps / s.duration}); t += fr / fps; }
  const idx = (tOld) => Math.max(0, old.findIndex((o, i) => tOld >= o.start - 1e-6 && (i === old.length - 1 || tOld < old[i + 1].start - 1e-6)));
  const map = (tOld) => { const i = idx(tOld); return neu[i].start + (tOld - old[i].start) * neu[i].k; };
  const mapF = (f) => Math.round(map(f / fps) * fps);
  const r4 = (x) => Math.round(x * 10000) / 10000;
  // script: starts, durations, caption chunks spread over the spoken part by character weight
  script.scenes.forEach((s, i) => {
    const n = neu[i]; s.start = r4(n.start); s.duration = r4(n.dur);
    const caps = s.captions ?? [], f0 = Math.round(n.start * fps), f1 = Math.round((n.start + n.dur) * fps);
    const clip = timing.clips.find((x) => x.scene === s.id);
    // spoken beats (between [PAUSE] markers) in film frames; a caption chunk lives inside the beat its first word
    // belongs to, so the screen holds still through the pause and the twist line lands with the voice
    const segs = (clip?.segments?.length ? clip.segments : [{words: 1e9, start: 0, end: n.speech}]).map((g) => ({...g, f0: f0 + Math.round(g.start * fps), f1: f0 + Math.round(g.end * fps)}));
    let wi = 0, cum = 0, gi = 0;
    const groups = segs.map(() => []);
    for (const c of caps) { while (gi < segs.length - 1 && wi >= cum + segs[gi].words) { cum += segs[gi].words; gi++; } groups[gi].push(c); wi += c[2].split(/\s+/).filter(Boolean).length; }
    groups.forEach((g, k) => {
      const w = g.map((c) => Math.max(1, c[2].replace(/\s/g, '').length)), W = w.reduce((x, y) => x + y, 0) || 1;
      let cur = segs[k].f0, acc = 0;
      g.forEach((c, j) => { acc += w[j]; c[0] = cur; c[1] = Math.max(cur + 1, segs[k].f0 + Math.round(((segs[k].f1 - segs[k].f0) * acc) / W)); cur = c[1]; });
    });
    // no gaps: each chunk holds until the next one starts; the last one holds to the scene end
    const flat = groups.flat();
    flat.forEach((c, j) => { if (j === 0) c[0] = f0; c[1] = j === flat.length - 1 ? f1 : flat[j + 1][0]; });
  });
  writeJson(J('script.json'), script);
  // storyboard: panel durations scale with their scene (whole frames, the last panel takes the remainder)
  const sb = opt('storyboard.json');
  if (sb) for (const sc of sb.scenes) {
    const n = neu.find((x) => x.id === sc.id); if (!n) continue;
    const total = Math.round(n.dur * fps); let used = 0;
    sc.panels.forEach((p, j) => {
      const fr = j === sc.panels.length - 1 ? total - used : Math.max(1, Math.round(p.duration * n.k * fps)); used += fr;
      const kk = fr / fps / p.duration, cap = (x) => r4(Math.min(fr / fps - 0.1, x * kk));
      p.duration = r4(fr / fps);
      for (const list of [p.beats, p.widgets, p.bespoke, p.sfx]) for (const e of list ?? []) if (typeof e.at === 'number') e.at = cap(e.at);
    });
  }
  // a bespoke scene continued across a cut (props.offset) picks up at the new length of the panels before it
  if (sb) for (const sc of sb.scenes) { let acc = {}; for (const p of sc.panels) { for (const b of p.bespoke ?? []) if (b.props && typeof b.props.offset === 'number' && b.props.offset > 0) b.props.offset = acc[b.id] ?? b.props.offset; for (const b of p.bespoke ?? []) acc[b.id] = (acc[b.id] ?? 0) + Math.round(p.duration * fps); } }
  if (sb) writeJson(J('storyboard.json'), sb);
  const panels = sb ? sb.scenes.flatMap((sc) => sc.panels.map((p) => ({...p, scene: sc.id}))) : [];
  const pk = (pid) => { const p = panels.find((x) => x.id === pid); const n = p && neu.find((x) => x.id === p.scene); return n ? n.k : 1; };
  const ws = opt('widgets.json');
  if (ws) { for (const w of ws.widgets ?? []) w.at = r4(Math.min((panels.find((p) => p.id === w.panel)?.duration ?? 99) - 0.1, w.at * pk(w.panel))); writeJson(J('widgets.json'), ws); }
  const total = Math.round(t * fps);
  const mo = opt('motion.json');
  if (mo) { for (const r of mo.resets ?? []) r.frame = mapF(r.frame); mo.frames = total; for (const am of mo.ambient ?? []) am.frames = [0, total]; writeJson(J('motion.json'), mo); }
  const vf = opt('vfx-plan.json');
  if (vf) { for (const sc of vf.scenes) for (const e of sc.effects ?? []) { const p = panels.find((x) => x.id === e.panel_id); if (!p) continue; const k = pk(e.panel_id); e.start = r4(e.start * k); e.duration = r4(Math.min(p.duration - e.start, e.duration * k)); } writeJson(J('vfx-plan.json'), vf); }
  const ac = opt('audio-cues.json') ?? {fps, cues: []};
  ac.frames = total;
  for (const c of ac.cues ?? []) c.frame = mapF(c.frame);
  for (const c of ac.music?.cuts ?? []) { c.from = mapF(c.from); c.to = mapF(c.to); }
  ac.duck = {...(ac.duck ?? {}), voiceover: timing.clips.map((c) => [Math.round(c.start * fps), Math.round((c.start + c.seconds) * fps)]), sfx_gain: ac.duck?.sfx_gain ?? 0.25};
  if (ac.music) ac.music.ducked_db = Math.round((ac.music.open_db - 12) * 10) / 10; // -12 dB = 25% of the open level
  writeJson(J('audio-cues.json'), ac);
  const brief = readJson(J('brief.json'));
  brief.voiceover = true; brief.voice = {provider: 'gemini', voice_id: timing.voice, env_key: 'GEMINI_API_KEY'}; brief.target_seconds = Math.round(t);
  brief.length_bucket = t <= 30 ? '15-30s' : t <= 60 ? '30-1m' : t <= 300 ? '1-5m' : t <= 600 ? '5-10m' : '10m+';
  writeJson(J('brief.json'), brief);
  return {seconds: t, frames: total, scenes: neu};
}

(async () => {
  loadEnv();
  if (cmd === 'models') { key(); const l = await listTts(); console.log(l.length ? l.join('\n') : 'FAIL no TTS model listed for this key'); process.exit(l.length ? 0 : 1); }
  if (cmd === 'sample') {
    if (!a.text || !a.out) fail('Usage: node generate-voiceover.js sample --text "<sentence>" --out <file.wav>');
    const au = await tts(String(a.text), a.voice, (a.style === undefined ? STYLE : String(a.style)), a.tag === undefined ? TAG : String(a.tag));
    const d = encode(au, String(a.out).replace(/\.(wav|mp3)$/, ''));
    console.log(`PASS ${a.out}: ${d.toFixed(2)} s, model ${au.model}, voice ${au.voice}, source ${au.mime || 'unknown'}`);
    return;
  }
  if (cmd === 'verify') {
    const v = await verify(String(work), String(a.text ?? ''));
    if (!v) fail('no transcription model answered');
    console.log(`${v.recall >= 0.9 && v.extra <= 3 ? 'PASS' : 'FAIL'} recall ${(v.recall * 100).toFixed(0)}%, ${v.extra} extra word(s): "${v.said.slice(0, 200)}"`);
    process.exit(v.recall >= 0.9 && v.extra <= 3 ? 0 : 1);
  }
  if (cmd !== 'make' || !work) { console.error('Usage: node generate-voiceover.js models | sample --text "..." --out f.wav | make <work-dir> [--voice Charon] [--pause 0.15] [--retime]'); process.exit(2); }
  const script = readJson(path.join(work, 'script.json')), fps = fpsOf(work), pause = Number(a.pause ?? 0.15);
  const dir = path.join(work, 'audio');
  fs.mkdirSync(dir, {recursive: true});
  const clips = [];
  let t = 0;
  const style = a.style === undefined ? STYLE : String(a.style), tag = a.tag === undefined ? TAG : String(a.tag);
  for (const s of script.scenes) {
    const raw = s.narration.replace(/\[VERIFY:[^\]]*\]/g, '').trim();
    // beats between [PAUSE n s] markers: [text, pause, text, pause, text]
    const bits = raw.split(/\[PAUSE\s*([0-9.]+)\s*s?\]/i);
    const beats = [];
    for (let i = 0; i < bits.length; i += 2) { const t = bits[i].trim(); const ps = i + 1 < bits.length ? Number(bits[i + 1]) : 0; if (t) beats.push({text: t, pause: ps}); else if (beats.length) beats[beats.length - 1].pause += ps; }
    if (!beats.length) continue;
    const text = beats.map((b) => b.text).join(' ');
    let au, v, segments, pauses, d;
    for (let attempt = 1; attempt <= 2; attempt++) {
      segments = []; pauses = [];
      const parts = [];
      let t0 = 0;
      for (const [k, b] of beats.entries()) {
        au = await tts(b.text, a.voice ?? 'Charon', style, tag);
        const base = path.join(dir, `vo-${s.id}-b${k + 1}`);
        let bd = encode(au, base);
        // a beat far longer than its words (a model that loops or drags under the long direction) is regenerated
        // once with the compact delivery tag instead; a second overlong read stops the run
        const nw = b.text.split(/\s+/).filter(Boolean).length, cap = nw * 0.5 + 1.5;
        if (bd > cap) {
          console.error(`note ${s.id} beat ${k + 1}: ${bd.toFixed(1)} s for ${nw} words (cap ${cap.toFixed(1)} s); regenerating with the compact tag`);
          au = await tts(b.text, a.voice ?? 'Charon', '', COMPACT);
          bd = encode(au, base);
          if (bd > cap) fail(`${s.id} beat ${k + 1}: still ${bd.toFixed(1)} s for ${nw} words. Stop and report.`);
        }
        segments.push({text: b.text, words: b.text.split(/\s+/).filter(Boolean).length, start: Math.round(t0 * 1000) / 1000, end: Math.round((t0 + bd) * 1000) / 1000});
        parts.push(`${base}.wav`); t0 += bd;
        const gap = k < beats.length - 1 ? Math.min(1.2, Math.max(0.6, b.pause || 0.6)) : 0; // 600 to 900 ms by the script, 1.2 s cap
        if (gap) { const sil = `${base}-gap.wav`; ff(['-f', 'lavfi', '-i', `anullsrc=r=44100:cl=mono:d=${gap.toFixed(3)}`, sil]); parts.push(sil); pauses.push({at: Math.round(t0 * 1000) / 1000, seconds: gap}); t0 += gap; }
      }
      const list = path.join(os.tmpdir(), `fs-vo-${process.pid}-${s.id}.txt`);
      fs.writeFileSync(list, parts.map((p) => `file '${path.resolve(p)}'`).join('\n'));
      ff(['-f', 'concat', '-safe', '0', '-i', list, '-ar', '44100', '-ac', '1', path.join(dir, `vo-${s.id}.wav`)]);
      ff(['-i', path.join(dir, `vo-${s.id}.wav`), '-codec:a', 'libmp3lame', '-b:a', '192k', path.join(dir, `vo-${s.id}.mp3`)]);
      fs.unlinkSync(list);
      for (const p of parts) { fs.rmSync(p, {force: true}); fs.rmSync(p.replace(/\.wav$/, '.mp3'), {force: true}); }
      d = secs(path.join(dir, `vo-${s.id}.wav`));
      v = a['no-verify'] ? null : await verify(path.join(dir, `vo-${s.id}.wav`), text);
      if (!v || (v.recall >= 0.85 && v.extra <= 3)) break;
      if (attempt === 2) fail(`${s.id}: the voice does not match the narration twice (recall ${(v.recall * 100).toFixed(0)}%, ${v.extra} extra words: "${v.said.slice(0, 120)}"). Stop and report.`);
      console.error(`note ${s.id}: transcript recall ${(v.recall * 100).toFixed(0)}%, regenerating once`);
    }
    clips.push({scene: s.id, model: au.model, voice: au.voice, file: `audio/vo-${s.id}.wav`, mp3: `audio/vo-${s.id}.mp3`, seconds: Math.round(d * 1000) / 1000, frames: Math.round(d * fps), start: 0, segments, pauses});
    console.log(`clip ${s.id}: ${d.toFixed(2)} s, ${segments.length} beat(s)${pauses.length ? `, pauses ${pauses.map((p) => p.seconds + ' s').join(' + ')}` : ''} (${au.model}, ${au.voice})${v ? `, transcript recall ${(v.recall * 100).toFixed(0)}%` : ''}`);
  }
  // merged track: each clip padded to its scene length (clip + pause, rounded up to a whole frame), so the
  // track lines up with the film frame for frame
  const list = path.join(os.tmpdir(), `fs-vo-${process.pid}.txt`), pads = [];
  for (const c of clips) {
    const fr = Math.ceil((c.seconds + pause) * fps - 0.001);
    c.start = Math.round(t * fps) / fps; c.scene_frames = fr; t += fr / fps;
    const pad = path.join(os.tmpdir(), `fs-vo-${process.pid}-${c.scene}-pad.wav`);
    ff(['-i', path.resolve(work, c.file), '-af', `apad=whole_dur=${(fr / fps).toFixed(4)}`, '-ar', '44100', '-ac', '1', pad]);
    pads.push(pad);
  }
  fs.writeFileSync(list, pads.map((p) => `file '${p}'`).join('\n'));
  ff(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', path.join(work, 'voiceover-dry.wav')]);
  fs.unlinkSync(list); pads.forEach((p) => fs.unlinkSync(p));
  if (new Set(clips.map((c) => c.voice)).size > 1) console.error(`WARN the narrator voice changed between clips (${[...new Set(clips.map((c) => c.voice))].join(', ')}): re-run when the quota resets for one voice throughout`);
  const timing = {provider: 'gemini', model: chosen.model, voice: chosen.voice, fps, pause, total_seconds: Math.round(secs(path.join(work, 'voiceover-dry.wav')) * 1000) / 1000, direction: style ? 'documentary storyteller' : 'plain', clips};
  writeJson(path.join(work, 'voiceover-timing.json'), timing);
  writeJson(path.join(dir, 'manifest.json'), {provider: 'gemini', clips: clips.map((c) => ({file: c.file, start: c.start, seconds: c.seconds})), voice_credit: 'voice-gemini'});
  if (a.retime) { const r = retime(work, timing, fps); console.log(`PASS retimed to the voice: ${r.frames} frames (${r.seconds.toFixed(2)} s); scene = clip + ${pause} s`); }
  // the 3-layer mix (pulse bed, sub-bass hits, transition SFX) under the narration -> voiceover.wav + voiceover.mp3
  if (a['no-mix']) { fs.copyFileSync(path.join(work, 'voiceover-dry.wav'), path.join(work, 'voiceover.wav')); ff(['-i', path.join(work, 'voiceover.wav'), '-codec:a', 'libmp3lame', '-b:a', '192k', path.join(work, 'voiceover.mp3')]); }
  else console.log(execFileSync(process.execPath, [path.join(__dirname, 'sound-bed.js'), work]).toString().trim());
  console.log(`PASS ${clips.length} clips, voiceover ${timing.total_seconds} s (${timing.model}, ${timing.voice}). Next: node scripts/build-film.js ${work}`);
})().catch((e) => fail(e && e.message ? e.message : String(e)));
