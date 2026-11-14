// Shared helpers for film-studio scripts. No dependencies beyond Node and the components/ install.
const fs = require('fs');
const path = require('path');
const {createRequire} = require('module');

const SKILL = path.resolve(__dirname, '..');
const COMPONENTS = path.join(SKILL, 'components');
const creq = createRequire(path.join(COMPONENTS, 'x.js'));
const ROLES = ['bg', 'ink', 'primary', 'secondary', 'highlight', 'shadow'];
const FONT_ROLES = ['display', 'body', 'accent', 'mono'];

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, v) => { fs.mkdirSync(path.dirname(p), {recursive: true}); fs.writeFileSync(p, JSON.stringify(v, null, 1) + '\n'); };
const listStyles = () => (fs.existsSync(path.join(SKILL, 'styles')) ? fs.readdirSync(path.join(SKILL, 'styles')) : []).filter((d) => fs.existsSync(path.join(SKILL, 'styles', d, 'design-system.json'))).sort();
const loadDS = (style) => {
  const p = path.join(SKILL, 'styles', style, 'design-system.json');
  if (!fs.existsSync(p)) throw new Error(`no design system for style "${style}" (${p})`);
  return readJson(p);
};
/** style.md frontmatter as an object. */
const frontmatter = (style) => {
  const p = path.join(SKILL, 'styles', style, 'style.md');
  if (!fs.existsSync(p)) return {};
  const m = fs.readFileSync(p, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? Object.fromEntries(m[1].split(/\r?\n/).map((l) => l.split(/:\s*/)).filter((a) => a.length >= 2).map(([k, ...v]) => [k.trim(), v.join(': ').trim()])) : {};
};

const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lum = (h) => { const [r, g, b] = hexRgb(h).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
/** Resolve a role or the pseudo-roles dark / light (darker / lighter of ink and bg). */
const roleHex = (roles, r) => r === 'dark' ? (lum(roles.ink) < lum(roles.bg) ? roles.ink : roles.bg) : r === 'light' ? (lum(roles.ink) < lum(roles.bg) ? roles.bg : roles.ink) : roles[r];
const dist = (a, b) => { const x = hexRgb(a), y = hexRgb(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };

const fontModule = (family) => family.replace(/[\s']/g, '');
const fontInfo = (family) => {
  // the bundler needs the ESM build; some families ship CommonJS only and would fail at render
  if (!fs.existsSync(path.join(COMPONENTS, 'node_modules', '@remotion', 'google-fonts', 'dist', 'esm', fontModule(family) + '.mjs'))) return null;
  try { return creq(`@remotion/google-fonts/${fontModule(family)}`).getInfo(); } catch (e) { return null; }
};

/** Deterministic 0..1 from a string (same algorithm every run; not Math.random). */
const hash01 = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 100000) / 100000; };

const args = (argv = process.argv.slice(2)) => {
  const o = {_: []};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) { const k = argv[i].slice(2); const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; o[k] = v; }
    else o._.push(argv[i]);
  }
  return o;
};
const fail = (msg) => { console.error('FAIL ' + msg); process.exit(1); };

module.exports = {SKILL, COMPONENTS, creq, ROLES, FONT_ROLES, readJson, writeJson, listStyles, loadDS, frontmatter, hexRgb, lum, contrast, roleHex, dist, fontModule, fontInfo, hash01, args, fail};
