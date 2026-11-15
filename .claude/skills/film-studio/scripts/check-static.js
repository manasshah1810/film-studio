#!/usr/bin/env node
// Usage: node check-static.js [--no-tsc]
// The skill's own static check. Run after any edit to the skill. Checks, without rendering anything:
//   line limits, every style complete (design system, style.md, Preview.tsx) and registered for FilmComposition,
//   effects library == effect components, widget library == widget registry (50), design systems, schema
//   examples, file references inside every doc and persona, no secrets, style gate (requires: none|web),
//   the run-all-checks gate selftest, type-check.
const fs = require('fs');
const path = require('path');
const {spawnSync} = require('child_process');
const {SKILL, COMPONENTS, readJson, listStyles, frontmatter, args} = require('./lib');

const a = args(), E = [], notes = [];
const rel = (p) => path.relative(SKILL, p).replace(/\\/g, '/');
const lines = (p) => fs.readFileSync(p, 'utf8').split(/\r?\n/).length - 1;
const ls = (d, ext) => (fs.existsSync(path.join(SKILL, d)) ? fs.readdirSync(path.join(SKILL, d)).filter((f) => f.endsWith(ext)).map((f) => path.join(SKILL, d, f)) : []);
const AGENTS = path.join(SKILL, '..', '..', 'agents');

// 1. line limits
const limit = (files, max, what) => { for (const f of files) { const n = lines(f); if (n >= max) E.push(`${rel(f)} has ${n} lines; ${what} must stay under ${max}`); } };
if (!fs.existsSync(path.join(SKILL, 'SKILL.md'))) E.push('SKILL.md is missing'); else limit([path.join(SKILL, 'SKILL.md')], 110, 'SKILL.md');
limit(ls('roles', '.md'), 161, 'a role manual');
// library manuals (one widget family or one motion module each) are opened only by the persona that needs them
const LIB_REF = /references[\\/](widgets|motion)-/;
limit(ls('references', '.md').filter((f) => !LIB_REF.test(f)), 161, 'a reference');
limit(ls('references', '.md').filter((f) => LIB_REF.test(f)), 330, 'a widget or motion library manual');
limit(ls('personas', '.md'), 161, 'a persona manual');
limit(ls('rubrics', '.md'), 80, 'a rubric');
limit(ls('library/platforms', '.md'), 80, 'a platform file');
if (fs.existsSync(AGENTS)) limit(fs.readdirSync(AGENTS).filter((f) => f.endsWith('.md')).map((f) => path.join(AGENTS, f)), 80, 'an agent file');

// 2. styles: files, frontmatter, Preview.tsx, registered in the FilmComposition design-system list
const styles = listStyles();
const reg = fs.readFileSync(path.join(COMPONENTS, 'src', 'design-systems.ts'), 'utf8');
for (const s of styles) {
  for (const f of ['style.md', 'design-system.json']) if (!fs.existsSync(path.join(SKILL, 'styles', s, f))) E.push(`styles/${s}/${f} is missing`);
  const sm = path.join(SKILL, 'styles', s, 'style.md');
  if (fs.existsSync(sm)) {
    limit([sm], 161, 'style.md');
    const fm = frontmatter(s);
    if (!['none', 'web'].includes(fm.requires)) E.push(`styles/${s}: requires is "${fm.requires}"; a style that needs a paid generation API must be removed`);
    if (!['draft', 'verified'].includes(fm.status)) E.push(`styles/${s}: status must be draft or verified`);
    if (fm.status === 'verified') { const pv = path.join(SKILL, '..', '..', '..', 'previews', s); const n = fs.existsSync(pv) ? fs.readdirSync(pv).filter((f) => f.endsWith('-sheet.png')).length : 0; if (n < 2) E.push(`styles/${s} is marked verified but has ${n} proof sheet(s) in previews/${s}; two palettes are required`); }
    else notes.push(`styles/${s} is still draft`);
  }
  const rb = path.join(SKILL, 'styles', s, 'rubric.md');
  if (fs.existsSync(rb)) { const n = (fs.readFileSync(rb, 'utf8').match(/^\| \d+ \|/gm) ?? []).length; if (n !== 10) E.push(`styles/${s}/rubric.md has ${n} parameters; it needs exactly 10`); }
  if (!fs.existsSync(path.join(COMPONENTS, 'styles', s, 'Preview.tsx'))) E.push(`components/styles/${s}/Preview.tsx is missing`);
  if (!reg.includes(`'../../styles/${s}/design-system.json'`)) E.push(`style ${s} is not in components/src/design-systems.ts, so FilmComposition cannot render it`);
}
// no two styles may share a rubric parameter list (each rubric is unique)
const sig = new Map();
for (const s of styles) { const rb = path.join(SKILL, 'styles', s, 'rubric.md'); if (!fs.existsSync(rb)) continue; const k = [...fs.readFileSync(rb, 'utf8').matchAll(/^\| \d+ \| ([^|]+) \|/gm)].map((m) => m[1].trim()).sort().join('|'); if (sig.has(k)) E.push(`styles/${s} and styles/${sig.get(k)} have the same rubric parameters`); sig.set(k, s); }

// 3. effects: library ids == registered components, at least 50, unique
const vdir = path.join(SKILL, 'library', 'vfx');
const lib = fs.readdirSync(vdir).filter((f) => f.endsWith('.json') && f !== 'style-rules.json').flatMap((f) => readJson(path.join(vdir, f)).entries.map((e) => e.id));
const src = fs.readdirSync(path.join(COMPONENTS, 'effects')).map((f) => fs.readFileSync(path.join(COMPONENTS, 'effects', f), 'utf8')).join('\n');
const comp = [...src.matchAll(/\b(?:reg|dip|fall)\('([a-z0-9-]+)'/g)].map((m) => m[1]);
if (new Set(lib).size !== lib.length) E.push('library/vfx has duplicate effect ids');
for (const id of lib) if (!comp.includes(id)) E.push(`effect "${id}" is in library/vfx but has no component`);
for (const id of comp) if (!lib.includes(id)) E.push(`effect component "${id}" is not in library/vfx`);
if (lib.length < 50) E.push(`library/vfx has ${lib.length} effects; 50 are required`);
const rules = readJson(path.join(vdir, 'style-rules.json'));
for (const s of styles) if (!rules.banned_tags[s]) E.push(`library/vfx/style-rules.json has no entry for style ${s}`);

// 3b. widgets: library/widgets.json == components/widgets/registry.ts, 50 ids, every file exists
const wl = readJson(path.join(SKILL, 'library', 'widgets.json')).entries;
const wr = fs.readFileSync(path.join(COMPONENTS, 'widgets', 'registry.ts'), 'utf8');
const wrIds = [...wr.matchAll(/^\t'([a-z0-9-]+)': \{family/gm)].map((m) => m[1]);
if (wl.length !== 50) E.push(`library/widgets.json has ${wl.length} widgets; 50 are required`);
for (const w of wl) { if (!wrIds.includes(w.id)) E.push(`widget "${w.id}" is in library/widgets.json but not in components/widgets/registry.ts`); if (!fs.existsSync(path.join(SKILL, w.file))) E.push(`widget "${w.id}": ${w.file} does not exist`); }
for (const id of wrIds) if (!wl.some((w) => w.id === id)) E.push(`widget "${id}" is in registry.ts but not in library/widgets.json`);

// 4. docs: every backticked repo path must exist; no secrets anywhere
const docs = [path.join(SKILL, 'SKILL.md'), path.join(SKILL, 'README.md'), path.join(SKILL, 'DECISIONS.md'), ...ls('roles', '.md'), ...ls('personas', '.md'), ...ls('rubrics', '.md'), ...ls('references', '.md'), ...ls('library/platforms', '.md'), ...ls('library/vfx', '.md'), ...ls('providers/voice', '.md'), ...styles.flatMap((s) => ls(`styles/${s}`, '.md')), ...(fs.existsSync(AGENTS) ? fs.readdirSync(AGENTS).filter((f) => f.endsWith('.md')).map((f) => path.join(AGENTS, f)) : [])].filter((f) => fs.existsSync(f));
const ROOTS = /^(scripts|roles|personas|rubrics|references|schemas|library|styles|components|providers)\//;
for (const f of docs) {
  const txt = fs.readFileSync(f, 'utf8');
  for (const m of txt.matchAll(/`([A-Za-z0-9_./<>*-]+\.(?:md|json|js|tsx?|ts))`/g)) {
    const p = m[1];
    if (!ROOTS.test(p) || /[<>*]/.test(p)) continue; // work/ files and patterns are checked at run time
    if (!fs.existsSync(path.join(SKILL, p))) E.push(`${rel(f)} refers to \`${p}\`, which does not exist`);
  }
  if (/[—–]/.test(txt)) E.push(`${rel(f)} contains an em or en dash`);
}
const SECRET = /(sk-[A-Za-z0-9]{20,}|xi-api-key["']?\s*[:=]\s*["'][A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|Bearer\s+[A-Za-z0-9._-]{24,}|api[_-]?key["']?\s*[:=]\s*["'][A-Za-z0-9]{16,})/;
const walk = (d) => fs.readdirSync(d, {withFileTypes: true}).flatMap((e) => (e.name === 'node_modules' || e.name.startsWith('.git') ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
for (const f of walk(SKILL)) if (/\.(md|json|js|ts|tsx|env)$/.test(f) && fs.statSync(f).size < 400000 && SECRET.test(fs.readFileSync(f, 'utf8'))) E.push(`${rel(f)} looks like it contains an API key`);
if (walk(SKILL).some((f) => path.basename(f) === '.env')) E.push('a .env file sits inside the skill folder; keys belong in the project root .env, listed in .gitignore');

// 4b. references: the cheatsheet lists exactly the 12 styles; every built style is one of them; 28 tells documented
const sheet = path.join(SKILL, 'references', 'style-cheatsheet.md'), tells = path.join(SKILL, 'references', 'ai-tells.md');
const sheetIds = fs.existsSync(sheet) ? [...fs.readFileSync(sheet, 'utf8').matchAll(/^\| `([a-z0-9-]+)` \|/gm)].map((m) => m[1]) : [];
if (sheetIds.length !== 12) E.push(`references/style-cheatsheet.md lists ${sheetIds.length} styles; it needs exactly 12`);
for (const s of styles) if (!sheetIds.includes(s)) E.push(`styles/${s} is not a row in references/style-cheatsheet.md`);
const tellRows = fs.existsSync(tells) ? [...fs.readFileSync(tells, 'utf8').matchAll(/^\| (\d+) \|/gm)].map((m) => +m[1]).sort((x, y) => x - y) : [];
if (tellRows.join() !== Array.from({length: 28}, (_, i) => i + 1).join()) E.push(`references/ai-tells.md documents rules [${tellRows.join(', ')}]; it needs 1 to 28, once each`);
// 4c. bespoke scenes: every registered id has its file, and a file exists for every import
const br = fs.readFileSync(path.join(COMPONENTS, 'bespoke', 'registry.ts'), 'utf8');
for (const m of br.matchAll(/from '\.\/([a-z0-9-]+\/[A-Za-z0-9]+)'/g)) if (!fs.existsSync(path.join(COMPONENTS, 'bespoke', `${m[1]}.tsx`))) E.push(`components/bespoke/registry.ts imports ${m[1]}, which does not exist`);
for (const f of ['preview.json']) if (fs.existsSync(path.join(SKILL, 'library', f))) E.push(`library/${f} is the retired shared preview; delete it`);

// 5. sub-checks
const run = (label, cmd, argv, cwd) => { const r = spawnSync(cmd, argv, {cwd, encoding: 'utf8', shell: process.platform === 'win32' && cmd.endsWith('tsc')}); if (r.status !== 0) E.push(`${label} failed:\n${(r.stdout + r.stderr).trim().split('\n').slice(-12).join('\n')}`); else notes.push(`${label}: ok`); };
run('design systems', process.execPath, [path.join(__dirname, 'check-design.js'), '--systems'], SKILL);
run('ai-tells selftest', process.execPath, [path.join(__dirname, 'check-ai-tells.js'), '--selftest'], SKILL);
run('schema examples', process.execPath, [path.join(__dirname, 'validate-schema.js'), '--examples'], SKILL);
run('run-all-checks selftest', process.execPath, [path.join(__dirname, 'run-all-checks.js'), '--selftest'], SKILL);
if (!a['no-tsc']) run('type-check', process.execPath, [path.join(COMPONENTS, 'node_modules', 'typescript', 'bin', 'tsc'), '--noEmit', '-p', '.'], COMPONENTS);

notes.forEach((n) => console.log('note ' + n));
if (E.length) { E.forEach((e) => console.error('FAIL ' + e)); console.error(`${E.length} problem(s)`); process.exit(1); }
console.log(`PASS static check: ${styles.length} styles, ${lib.length} effects, ${docs.length} docs`);
