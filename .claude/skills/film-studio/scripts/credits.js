#!/usr/bin/env node
// Usage:
//   node credits.js add <work-dir> --id <asset-id> --kind image|video|audio|music|voice|font|code --url <https://...>
//                   --author "<name>" --license <id> [--attribution "<text>"] [--trademark] [--note "<text>"]
//   node credits.js fonts <work-dir>      record the film's font pairing (from brief.json)
//   node credits.js check <work-dir>      every media asset and audio clip has an allowed licence
//   node credits.js text <work-dir>       credit lines to paste under the video
//   node credits.js licences              print the allow-list
// The licence ledger. A licence that is not in library/licences.json is refused: unclear means reject.
const fs = require('fs');
const path = require('path');
const {SKILL, readJson, writeJson, loadDS, args, fail} = require('./lib');

const a = args();
const [cmd, work] = a._;
const lic = readJson(path.join(SKILL, 'library', 'licences.json'));
if (cmd === 'licences') {
  for (const [id, l] of Object.entries(lic.allowed)) console.log(`${id.padEnd(14)} ${l.name}${l.attribution ? ' (attribution required)' : ''}. ${l.note}`);
  console.log('\nAlways rejected:'); lic.always_reject.forEach((r) => console.log('  - ' + r));
  console.log('\nFlag as trademark-sensitive when:'); lic.trademark_flag_when.forEach((r) => console.log('  - ' + r));
  process.exit(0);
}
if (!cmd || !work) { console.error('Usage: node credits.js add|fonts|check|text <work-dir> ... | licences'); process.exit(2); }
const cp = path.join(work, 'credits.json');
const load = () => (fs.existsSync(cp) ? readJson(cp) : {items: []});
const today = () => new Date().toISOString().slice(0, 10);
const put = (c, item) => { c.items = c.items.filter((i) => i.asset_id !== item.asset_id); c.items.push(item); };

if (cmd === 'add') {
  for (const k of ['id', 'kind', 'url', 'author', 'license']) if (!a[k] || a[k] === true) fail(`--${k} is required`);
  const l = lic.allowed[a.license];
  if (!l) fail(`licence "${a.license}" is not on the allow-list. Do not use this asset. (node credits.js licences)`);
  if (!/^https:\/\//.test(a.url)) fail('--url must be the https page where the licence is stated');
  if (l.attribution && (!a.attribution || a.attribution === true)) fail(`${a.license} requires --attribution "<title> by <author>, <licence>"`);
  const c = load();
  put(c, {asset_id: a.id, kind: a.kind, source_url: a.url, author: String(a.author), license: a.license, date_checked: today(), trademark_sensitive: !!a.trademark, ...(a.attribution ? {attribution: String(a.attribution)} : {}), ...(a.note ? {note: String(a.note)} : {})});
  writeJson(cp, c);
  console.log(`PASS recorded ${a.id} (${a.license})${a.trademark ? '. FLAG: trademark-sensitive, the user must approve it before render' : ''}`);
} else if (cmd === 'fonts') {
  const brief = readJson(path.join(work, 'brief.json')), pair = loadDS(brief.style).fonts.find((f) => f.id === brief.design.pairing_id);
  if (!pair) fail(`pairing ${brief.design?.pairing_id} not found`);
  const c = load();
  for (const fam of new Set(['display', 'body', 'accent', 'mono'].map((r) => pair[r].family)))
    put(c, {asset_id: 'font-' + fam.toLowerCase().replace(/[^a-z0-9]+/g, '-'), kind: 'font', source_url: 'https://fonts.google.com/specimen/' + encodeURIComponent(fam).replace(/%20/g, '+'), author: 'See the specimen page', license: 'Google-Fonts', date_checked: today(), trademark_sensitive: false, note: 'Loaded through @remotion/google-fonts. [CHECK] the licence tab of this family.'});
  writeJson(cp, c);
  console.log(`PASS fonts recorded for pairing ${pair.id}`);
} else if (cmd === 'check') {
  const c = load(), errs = [], flags = [];
  const have = new Map(c.items.map((i) => [i.asset_id, i]));
  const castP = path.join(work, 'cast.json'), manP = path.join(work, 'audio', 'manifest.json');
  if (fs.existsSync(castP)) for (const as of readJson(castP).assets) if (as.def.kind === 'media' && !have.has(as.id)) errs.push(`cast "${as.id}" is sourced media with no credits entry`);
  if (fs.existsSync(manP)) { const m = readJson(manP); for (const id of [m.voice_credit, m.music_credit].filter(Boolean)) if (!have.has(id)) errs.push(`audio "${id}" has no credits entry`); }
  for (const i of c.items) {
    if (!lic.allowed[i.license]) errs.push(`${i.asset_id}: licence "${i.license}" is not allowed`);
    else if (lic.allowed[i.license].attribution && !i.attribution) errs.push(`${i.asset_id}: attribution text missing`);
    if (i.trademark_sensitive) flags.push(i.asset_id);
  }
  flags.forEach((f) => console.log(`FLAG ${f}: trademark-sensitive; needs the user's approval`));
  if (errs.length) fail(errs.join('\nFAIL '));
  console.log(`PASS ${c.items.length} credit entr${c.items.length === 1 ? 'y' : 'ies'}, ${flags.length} flagged`);
} else if (cmd === 'text') {
  const c = load();
  const lines = c.items.filter((i) => i.kind !== 'font').map((i) => i.attribution ?? `${i.asset_id}: ${i.author} (${lic.allowed[i.license]?.name ?? i.license}) ${i.source_url}`);
  const fonts = c.items.filter((i) => i.kind === 'font').map((i) => i.asset_id.replace(/^font-/, '').replace(/-/g, ' '));
  console.log([...lines, fonts.length ? `Fonts: ${fonts.join(', ')} (Google Fonts)` : '', 'Drawn and animated in code with Remotion.'].filter(Boolean).join('\n'));
} else fail(`unknown command "${cmd}"`);
