#!/usr/bin/env node
// Usage:
//   node pick-design.js --suggest "<topic>" [--tone "<words>"]      top 3 styles for the Director's question 3
//   node pick-design.js <work-dir> [--palette id] [--pairing id]    lock palette + pairing into brief.json
//   node pick-design.js --list <style>                              print a style's palettes and pairings
// Choices are deterministic for a topic (same brief, same design) but differ between topics, so two
// films in one style do not look alike. Roles never type a hex or a font name; they pick ids here.
const path = require('path');
const {readJson, writeJson, loadDS, listStyles, frontmatter, hash01, args, fail, SKILL} = require('./lib');
const fs = require('fs');

const a = args();
const tokens = (s) => String(s).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
// plain-language topic words -> the tags used in palette best_for lists and style.md
const SYN = {company: 'business', startup: 'business', fall: 'failure', collapse: 'failure', fail: 'failure', rise: 'business', money: 'money', finance: 'money', bank: 'money', crisis: 'crisis', crash: 'crisis', cat: 'animals', cats: 'animals', dog: 'animals', funny: 'playful', fun: 'playful', kids: 'kids', school: 'education', learn: 'education', study: 'study', history: 'history', war: 'history', phone: 'tech', software: 'tech', internet: 'internet', game: 'gaming', games: 'gaming', science: 'science', space: 'space', health: 'health', food: 'food', travel: 'travel', music: 'music', climate: 'climate', nature: 'nature', serious: 'serious', sad: 'serious', mystery: 'mystery', crime: 'crime', data: 'data', numbers: 'data', works: 'how-it-works', engineering: 'engineering', design: 'design', story: 'biography', life: 'biography', rivalry: 'rivalry', versus: 'rivalry'};
const tagsFor = (text) => { const t = tokens(text); return new Set([...t, ...t.map((w) => SYN[w]).filter(Boolean)]); };
const offerable = () => listStyles().filter((s) => ['none', 'web'].includes(frontmatter(s).requires));
const styleDoc = (s) => { const p = path.join(SKILL, 'styles', s, 'style.md'); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; };

if (a.suggest) {
  const want = tagsFor(`${a.suggest} ${a.tone ?? ''}`);
  const rows = offerable().map((s) => {
    const ds = loadDS(s), doc = styleDoc(s);
    const pick = tokens((doc.match(/\*\*Pick it when:\*\*(.*)/) ?? ['', ''])[1]), skip = tokens((doc.match(/\*\*Skip it when:\*\*(.*)/) ?? ['', ''])[1]);
    const tags = new Set(ds.palettes.flatMap((p) => p.best_for));
    const score = [...want].reduce((n, w) => n + (tags.has(w) ? 2 : 0) + (pick.includes(w) ? 3 : 0) - (skip.includes(w) ? 4 : 0), 0) + hash01(a.suggest + s) * 0.9;
    return {style: s, title: frontmatter(s).title ?? s, score, status: frontmatter(s).status};
  }).sort((x, y) => y.score - x.score);
  console.log(`Top 3 styles for "${a.suggest}":`);
  rows.slice(0, 3).forEach((r, i) => console.log(`${i + 1}. ${r.style} (${r.title})${r.status === 'verified' ? '' : ' [not verified]'}`));
  console.log(`Others: ${rows.slice(3).map((r) => r.style).join(', ')}`);
  console.log('A custom request is mapped to the closest of these; record it in brief.style_note.');
  process.exit(0);
}
if (a.list) {
  const ds = loadDS(a.list);
  console.log('palettes: ' + ds.palettes.map((p) => `${p.id} (${p.mood})`).join('; '));
  console.log('pairings: ' + ds.fonts.map((p) => `${p.id} (${p.mood})`).join('; '));
  process.exit(0);
}
const work = a._[0];
if (!work) { console.error('Usage: node pick-design.js <work-dir> [--palette id] [--pairing id] | --suggest "<topic>" | --list <style>'); process.exit(2); }
const bp = path.join(work, 'brief.json');
if (!fs.existsSync(bp)) fail(`${bp} missing`);
const brief = readJson(bp);
if (!offerable().includes(brief.style)) fail(`style "${brief.style}" cannot be offered (have: ${offerable().join(', ')})`);
const ds = loadDS(brief.style);
const want = tagsFor(`${brief.topic} ${brief.tone ?? ''} ${brief.audience ?? ''}`);
const seed = String(brief.design?.seed ?? brief.topic);
// rank palettes by tag overlap, then take one of the best three by topic hash
const ranked = ds.palettes.map((p) => ({p, n: p.best_for.filter((t) => want.has(t)).length + tokens(p.mood).filter((t) => want.has(t)).length})).sort((x, y) => y.n - x.n || hash01(seed + x.p.id) - hash01(seed + y.p.id));
const pool = ranked.filter((r) => r.n === ranked[0].n).slice(0, 3);
const pal = a.palette ? ds.palettes.find((p) => p.id === a.palette) : pool[Math.floor(hash01(seed + 'pal') * pool.length)].p;
const pair = a.pairing ? ds.fonts.find((p) => p.id === a.pairing) : ds.fonts[Math.floor(hash01(seed + 'pair') * ds.fonts.length)];
if (!pal) fail(`palette "${a.palette}" is not in ${brief.style} (${ds.palettes.map((p) => p.id).join(', ')})`);
if (!pair) fail(`pairing "${a.pairing}" is not in ${brief.style} (${ds.fonts.map((p) => p.id).join(', ')})`);
brief.design = {palette_id: pal.id, pairing_id: pair.id, seed};
writeJson(bp, brief);
console.log(`PASS ${brief.style}: palette ${pal.id} (${pal.mood}), pairing ${pair.id} (${pair.mood}), seed "${seed}"`);
console.log(`Matched tags: ${pal.best_for.filter((t) => want.has(t)).join(', ') || 'none (chosen by topic hash)'}`);
