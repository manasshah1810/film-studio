#!/usr/bin/env node
// Usage:
//   node voice.js check [--provider id]          which providers can run on this machine
//   node voice.js make <work-dir> [--dry]        one audio clip per script scene + audio/manifest.json
// Providers (brief.voice.provider):
//   system      free, local: Windows speech, macOS `say`, or Linux `espeak-ng`
//   piper       free, local neural voice: `piper` on PATH and PIPER_MODEL=<path to .onnx>
//   elevenlabs  paid API; key read from the env var named in brief.voice.env_key (default ELEVENLABS_API_KEY)
//   openai      paid API; key read from the env var named in brief.voice.env_key (default OPENAI_API_KEY)
// With brief.voiceover false there is nothing to make: the film is captions-only.
// The key is read from the environment (or .env in the project root) and is never printed, logged or written.
const fs = require('fs');
const path = require('path');
const {execFileSync, spawnSync} = require('child_process');
const {readJson, writeJson, args, fail} = require('./lib');

const a = args();
const [cmd, work] = a._;
const has = (bin) => spawnSync(process.platform === 'win32' ? 'where' : 'which', [bin], {stdio: 'ignore'}).status === 0;
// .env is read into this process only; values are never echoed
const loadEnv = () => { for (const p of [path.join(process.cwd(), '.env'), work ? path.join(work, '..', '.env') : '']) if (p && fs.existsSync(p)) for (const l of fs.readFileSync(p, 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*"?([^"#]*)"?\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim(); } };
const DEFAULT_KEY = {elevenlabs: 'ELEVENLABS_API_KEY', openai: 'OPENAI_API_KEY'};
const ready = (p, keyName) => {
  if (p === 'system') return process.platform === 'win32' ? true : process.platform === 'darwin' ? has('say') : has('espeak-ng');
  if (p === 'piper') return has('piper') && !!process.env.PIPER_MODEL && fs.existsSync(process.env.PIPER_MODEL);
  return !!process.env[keyName ?? DEFAULT_KEY[p]];
};
const secs = (file) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());

const speak = {
  system(text, out) {
    if (process.platform === 'win32') {
      // text goes through a temp file so nothing from the script is ever interpolated into a command line
      const tf = out + '.txt';
      fs.writeFileSync(tf, text);
      execFileSync('powershell', ['-NoProfile', '-Command', "Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.SetOutputToWaveFile($args[0]); $s.Speak([IO.File]::ReadAllText($args[1])); $s.Dispose()", out, tf]);
      fs.unlinkSync(tf);
    } else if (process.platform === 'darwin') execFileSync('say', ['-o', out, '--data-format=LEI16@22050', text]);
    else execFileSync('espeak-ng', ['-w', out, text]);
  },
  piper(text, out) { execFileSync('piper', ['--model', process.env.PIPER_MODEL, '--output_file', out], {input: text}); },
  // Request shapes below follow the providers' public docs as last read [CHECK before first use]; nothing else is assumed.
  async elevenlabs(text, out, v, key) {
    if (!v.voice_id) fail('brief.voice.voice_id is required for elevenlabs');
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(v.voice_id)}`, {method: 'POST', headers: {'xi-api-key': key, 'content-type': 'application/json'}, body: JSON.stringify({text})});
    if (!r.ok) fail(`elevenlabs returned HTTP ${r.status}. Stop and report; do not retry in a loop.`);
    fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
  },
  async openai(text, out, v, key) {
    const r = await fetch('https://api.openai.com/v1/audio/speech', {method: 'POST', headers: {authorization: `Bearer ${key}`, 'content-type': 'application/json'}, body: JSON.stringify({model: v.model ?? 'tts-1', voice: v.voice_id ?? 'alloy', input: text})});
    if (!r.ok) fail(`openai returned HTTP ${r.status}. Stop and report; do not retry in a loop.`);
    fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
  },
};

(async () => {
  loadEnv();
  if (cmd === 'check') {
    for (const p of a.provider ? [a.provider] : Object.keys(speak)) console.log(`${ready(p) ? 'READY  ' : 'MISSING'} ${p}${DEFAULT_KEY[p] ? ` (needs env ${DEFAULT_KEY[p]}; paid)` : ' (free, local)'}`);
    console.log('READY   captions-only (voiceover: false) needs nothing');
    return;
  }
  if (cmd !== 'make' || !work) { console.error('Usage: node voice.js check | make <work-dir> [--dry]'); process.exit(2); }
  const brief = readJson(path.join(work, 'brief.json')), script = readJson(path.join(work, 'script.json'));
  if (!brief.voiceover) { console.log('PASS captions-only film: no audio made. Captions come from storyboard panel captions.'); return; }
  const v = brief.voice, keyName = v.env_key ?? DEFAULT_KEY[v.provider];
  if (!speak[v.provider]) fail(`unknown provider "${v.provider}"`);
  if (!ready(v.provider, keyName)) fail(keyName ? `environment variable ${keyName} is not set. Put it in .env (listed in .gitignore) or the shell; never paste the key into chat or a file in work/` : `${v.provider} is not installed on this machine (node voice.js check)`);
  const dir = path.join(work, 'audio'), ext = ['system', 'piper'].includes(v.provider) ? 'wav' : 'mp3';
  fs.mkdirSync(dir, {recursive: true});
  const clips = [], late = [];
  for (const s of script.scenes) {
    if (!s.narration.trim()) continue;
    const file = `${s.id}.${ext}`, out = path.join(dir, file);
    if (a.dry) { console.log(`would speak ${s.id}: ${s.narration.length} characters`); continue; }
    await speak[v.provider](s.narration.replace(/\[VERIFY:[^\]]*\]/g, ''), out, v, keyName ? process.env[keyName] : undefined);
    const d = secs(out);
    if (d > s.duration + 0.15) late.push(`${s.id}: voice runs ${d.toFixed(1)} s, scene is ${s.duration} s`);
    clips.push({file: `audio/${file}`, start: s.start, seconds: Math.round(d * 100) / 100});
  }
  if (a.dry) return;
  writeJson(path.join(dir, 'manifest.json'), {provider: v.provider, clips, voice_credit: ['system', 'piper'].includes(v.provider) ? undefined : `voice-${v.provider}`});
  if (late.length) fail(`voice is longer than its scene (shorten the narration or lengthen the scene, then re-run):\nFAIL ${late.join('\nFAIL ')}`);
  console.log(`PASS ${clips.length} clip(s) in ${dir}${keyName ? `. Record the voice licence: credits.js add ${work} --id voice-${v.provider} --kind voice ...` : ''}`);
})().catch((e) => fail(e && e.message ? e.message : String(e)));
