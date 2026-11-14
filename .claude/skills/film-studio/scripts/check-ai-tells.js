#!/usr/bin/env node
// Usage:
//   node check-ai-tells.js <work-dir> [--stage script|storyboard|final] [--ds <file>] [--json] [--out report.json]
//   node check-ai-tells.js --list        the 25 rules, one line each
//   node check-ai-tells.js --selftest    prove every rule passes on the good fixture and fires on the bad one
// Zero tokens: run it, do not read it. Exit 0 = all rules of the stage PASS, 1 = any FAIL.
// The 25 rules are documented, with a pass and a fail example each, in references/ai-tells.md.
// Stages: script = rules that need only script.json; storyboard = those plus the picture rules;
// final (default) = all 25, and a missing input file is a FAIL.
const fs = require('fs');
const path = require('path');
const {SKILL, readJson, args} = require('./lib');
const {load, boxesOf, isText, captionsOf, allCopy, words, sentences, EDGES, NAMED_EASINGS, BANNED_EASINGS} = require('./plan');
const {checkPlan, checkSystem, gradientErrs, TYPE_RATIO} = require('./check-design');
const {checkSafe} = require('./check-safezones');

// ---- the hardcoded limits (same numbers as references/ai-tells.md) ----
const OPENER = /^[\s"'([]*(why|how|what\s+is|what's|what\s+are|in\s+this\s+video|today\s+(we|i)|welcome|hey\s+guys|let'?s\s+(talk|dive|explore|look)|have\s+you\s+ever|did\s+you\s+know)\b/i;
const BUZZ = [/\bdelv(e|es|ed|ing)\b/i, /\btapestry\b/i, /\btestament\b/i, /\bgame[- ]?changer/i, /\bunlock(s|ing)? the secrets?\b/i, /\bfast[- ]paced world\b/i, /\bever wondered\b/i];
const HOLD_SECONDS = 3.5;          // 3: longest gap between two visual events
const DEAD_FRAMES = 45;            // 4: longest run with nothing moving (at 30 fps)
const CENTER_SHARE = 0.4;          // 5
const CENTER_BAND = [45, 55];      // 5: a box whose centre x is in this band is centred
const CAPTION_WORDS = 5;           // 10
const CADENCE_STDEV = 2;           // 11: words per sentence, standard deviation
const CAUSAL = /\b(because|so|but|therefore|which means|that's why|that is why|until|unless|instead|yet|except|turns out|as a result|then)\b/gi;
const LISTY = /\b(first|firstly|second|secondly|third|thirdly|fourth|next|also|another|additionally|moreover|furthermore|lastly|finally|number (one|two|three|\d)|tip (#|number )?\d|step \d)\b/gi;
const PLACEHOLDER = /\b(specimen|placeholder|lorem)\b|42\s?%/i; // 14
const OVERLAP_AREA = 0.25;         // 15: percent-of-frame squared that counts as a collision
const ORPHAN_CHARS = 3;            // 20
const INTERRUPT_SECONDS = 1.5;     // 21
const SAME_TRANSITIONS = 2;        // 22
const SFX_FRAMES = 2;              // 23
const CHAR_W = 0.55;               // 20: average glyph width as a share of the font size, for wrap estimates

const sb = (P) => P.panels;
const stdev = (xs) => { const m = xs.reduce((a, b) => a + b, 0) / xs.length; return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length); };
const narration = (P) => (P.script?.scenes ?? []).flatMap((s) => sentences(s.narration));
const transitionIds = () => { try { return new Set(readJson(path.join(SKILL, 'library', 'vfx', 'transitions.json')).entries.map((e) => e.id)); } catch (e) { return new Set(); } };
const linesOf = (b, W) => (b.lines?.length ? b.lines : /\n/.test(b.text ?? '') ? b.text.split('\n') : wrap(b.text ?? '', Math.max(1, Math.floor(((b.w / 100) * W) / ((b.px || 48) * CHAR_W)))));
function wrap(text, max) { const out = []; let cur = ''; for (const w of words(text)) { if (cur && (cur + ' ' + w).length > max) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; } if (cur) out.push(cur); return out; }

// needs: which inputs a rule reads. stage: the first stage at which it can run.
const RULES = [
  {n: 1, id: 'opener', stage: 'script', needs: ['script'], title: 'No Why / How / What-is opener', run(P) {
    const first = [['script s1 narration', sentences(P.script.scenes[0]?.narration)[0]], ['script s1 on_screen_text', P.script.scenes[0]?.on_screen_text]];
    const p = sb(P)[0];
    if (p) first.push([`${p.id} headline`, p.slots?.headline], [`${p.id} caption`, captionsOf(p)[0]], [`${p.id} first text box`, boxesOf(p).find((b) => isText(b) && b.kind !== 'caption')?.text]);
    return first.filter(([, t]) => t && OPENER.test(t)).map(([w, t]) => `${w} opens with "${words(t).slice(0, 3).join(' ')}...". Fix: open on a paradox or flip a belief, as a statement ("You do not need more discipline.").`);
  }},
  {n: 2, id: 'buzzwords', stage: 'script', needs: ['script'], title: 'No AI buzzwords', run(P) {
    return allCopy(P).flatMap(({where, text}) => BUZZ.filter((r) => r.test(text)).map((r) => `${where}: "${text.match(r)[0]}" is a banned buzzword. Fix: say the plain thing it stands for.`));
  }},
  {n: 3, id: 'static-hold', stage: 'final', needs: ['storyboard'], title: 'Max 3.5 s static hold', run(P) {
    const max = Math.round(HOLD_SECONDS * P.fps), fs_ = [...new Set(P.events.map((e) => e.f)), P.totalFrames], E = [];
    for (let i = 1; i < fs_.length; i++) if (fs_[i] - fs_[i - 1] > max) { const ev = P.events.find((e) => e.f === fs_[i - 1]); E.push(`${ev.at}: ${((fs_[i] - fs_[i - 1]) / P.fps).toFixed(1)} s with no new visual event after frame ${fs_[i - 1]} (max ${HOLD_SECONDS} s). Fix: add a beat, widget or effect inside that gap, or split the panel.`); }
    return E;
  }},
  {n: 4, id: 'dead-velocity', stage: 'final', needs: ['storyboard'], title: 'Zero dead velocity over 45 frames', run(P) {
    const max = Math.round((DEAD_FRAMES * P.fps) / 30), iv = [...P.motion].sort((a, b) => a[0] - b[0]), E = [];
    let end = 0;
    for (const [a, b] of [...iv, [P.totalFrames, P.totalFrames]]) { if (a - end > max) { const p = P.panels.find((x) => end >= x.start && end < x.start + x.frames); E.push(`${p?.id}: nothing moves from frame ${end} to ${a} (${a - end} frames, max ${max}). Fix: add a whole-panel camera effect (duration = the panel) or a beat in that range.`); } end = Math.max(end, b); }
    return E;
  }},
  {n: 5, id: 'center-only', stage: 'storyboard', needs: ['storyboard'], title: 'Centre-only layouts at most 40%', run(P) {
    const centred = sb(P).filter((p) => { const t = boxesOf(p).filter((b) => isText(b) && b.kind !== 'caption' && b.kind !== 'widget'); return t.length ? t.every((b) => { const c = b.x + b.w / 2; return c >= CENTER_BAND[0] && c <= CENTER_BAND[1]; }) : !p.anchor || p.anchor === 'c'; });
    const share = centred.length / Math.max(1, sb(P).length);
    return share > CENTER_SHARE ? [`${centred.length} of ${sb(P).length} panels are centre-only (${Math.round(share * 100)}%, max ${CENTER_SHARE * 100}%): ${centred.map((p) => p.id).join(', ')}. Fix: move the text block of ${centred.length - Math.floor(CENTER_SHARE * sb(P).length)} of them off centre (x 8, or right-aligned to x + w = 85).`] : [];
  }},
  {n: 6, id: 'adjacent-layout', stage: 'storyboard', needs: ['storyboard'], title: 'No adjacent duplicate layout ids', run(P) {
    return sb(P).slice(1).filter((p, i) => p.layout === sb(P)[i].layout).map((p) => `${sb(P)[p.index - 1].id} and ${p.id} both use layout "${p.layout}". Fix: change one of them.`);
  }},
  {n: 7, id: 'gradient', stage: 'storyboard', needs: ['storyboard'], title: 'No default purple-blue gradient', run(P) {
    return [...(P.ds ? gradientErrs(JSON.stringify(P.ds), 'design system', null) : []), ...gradientErrs(JSON.stringify(P.storyboard), 'storyboard', P.roles), ...gradientErrs(JSON.stringify(P.cast ?? {}), 'cast', P.roles)];
  }},
  {n: 8, id: 'stick-figure', stage: 'storyboard', needs: ['storyboard', 'ds'], title: 'No stick-figure circle and line primitives', run(P) {
    const E = [], mode = P.ds.subject_mode, chars = (P.cast?.assets ?? []).filter((a) => a.def?.kind === 'character');
    if (!['layered', 'ui-first'].includes(mode)) E.push(`design system subject_mode is ${JSON.stringify(mode)}. Fix: "layered" or "ui-first".`);
    if (P.ds.figure && (P.ds.figure.body === 'line' || P.ds.figure.limbStyle === 'line')) E.push('design system "figure" is a line-limbed rig. Fix: delete it.');
    if (mode === 'ui-first') {
      for (const a of chars) E.push(`cast "${a.id}" is a character but the style is ui-first. Fix: delete it and tell the beat with widgets and type.`);
      for (const p of sb(P)) if (p.slots?.cast?.length) E.push(`${p.id}: slots.cast places a character in a ui-first style. Fix: remove it.`);
    }
    for (const a of chars) {
      const layers = a.def.layers ?? [], types = new Set(layers.flatMap((l) => (l.shapes ?? []).map((s) => s.t)));
      if (layers.length < 4) E.push(`cast "${a.id}" has ${layers.length} layers; a layered subject needs at least 4 (head or face, torso, limbs, shadow). Fix: build it from named layers, each with shapes.`);
      else if (![...types].some((t) => !['ellipse', 'circle', 'line'].includes(t))) E.push(`cast "${a.id}" is drawn only from ${[...types].join(' + ')}: a stick figure. Fix: use poly or rect shapes for torso and limbs.`);
    }
    return E;
  }},
  {n: 9, id: 'easing', stage: 'final', needs: ['storyboard', 'ds'], title: 'Named spring or bezier easing required', run(P) {
    const ok = new Set([...Object.keys(P.ds.motion?.easings ?? {}), ...NAMED_EASINGS].filter((e) => !BANNED_EASINGS.includes(e))), E = [];
    const chk = (where, e, required) => { if (e == null) { if (required) E.push(`${where}: no "easing". Fix: name one of ${[...ok].slice(0, 6).join(', ')}.`); } else if (BANNED_EASINGS.includes(e) || !ok.has(e)) E.push(`${where}: easing "${e}" is ${BANNED_EASINGS.includes(e) ? 'a default curve' : 'not a named curve'}. Fix: one of ${[...ok].slice(0, 6).join(', ')}.`); };
    for (const p of sb(P)) {
      (p.beats ?? []).forEach((b, i) => chk(`${p.id} beat ${i + 1}`, b.easing, true));
      (p.widgets ?? []).forEach((w) => chk(`${p.id} widget "${w.id}"`, w.easing, true));
      if (p.transition) chk(`${p.id} transition`, p.transition.easing, true);
      p.fx.forEach((e) => chk(`${p.id} effect "${e.effect_id}"`, e.easing ?? e.params?.easing, false));
    }
    return E;
  }},
  {n: 10, id: 'caption-chunk', stage: 'storyboard', needs: ['storyboard'], title: 'Max 5 words per caption chunk', run(P) {
    return sb(P).flatMap((p) => captionsOf(p).filter((c) => words(c).length > CAPTION_WORDS).map((c) => `${p.id}: caption chunk "${c}" has ${words(c).length} words (max ${CAPTION_WORDS}). Fix: use "captions": ["${words(c).slice(0, CAPTION_WORDS).join(' ')}", "${words(c).slice(CAPTION_WORDS, CAPTION_WORDS * 2).join(' ')}"].`));
  }},
  {n: 11, id: 'cadence', stage: 'script', needs: ['script'], title: 'Sentence length cadence varies', run(P) {
    const n = narration(P).map((s) => words(s).length), E = [];
    if (n.length < 2) return E;
    if (n.length < 4 ? Math.max(...n) - Math.min(...n) < 2 : stdev(n) < CADENCE_STDEV) E.push(`sentence lengths ${n.join(', ')} are too even (spread ${stdev(n).toFixed(1)} words, needs ${CADENCE_STDEV}). Fix: cut one sentence to 2-4 words and let another run past 12.`);
    for (let i = 2; i < n.length; i++) { const t = n.slice(i - 2, i + 1); if (Math.max(...t) - Math.min(...t) <= 1) { E.push(`sentences ${i - 1} to ${i + 1} are ${t.join(', ')} words: three in a row at the same length. Fix: make the middle one much shorter or longer.`); break; } }
    return E;
  }},
  {n: 12, id: 'causal', stage: 'script', needs: ['script'], title: 'Causal connectors over flat listicles', run(P) {
    const text = (P.script.scenes ?? []).map((s) => s.narration).join(' '), c = (text.match(CAUSAL) ?? []).length, l = (text.match(LISTY) ?? []).length, need = Math.max(2, Math.ceil(narration(P).length / 4)), E = [];
    if (c < need) E.push(`${c} causal connector(s) in ${narration(P).length} sentences; needs ${need}. Fix: join beats with because, so, but, therefore, until, instead.`);
    if (l > c) E.push(`${l} list markers (first, next, also...) against ${c} causal connectors: this is a listicle. Fix: replace "X. Also Y." with "X, so Y." or "X, but Y."`);
    return E;
  }},
  {n: 13, id: 'anchored', stage: 'storyboard', needs: ['storyboard'], title: 'Widgets and cards are anchored', run(P) {
    return sb(P).flatMap((p) => { const ids = new Set(boxesOf(p).map((b) => b.id)); return [...(p.widgets ?? []).map((w) => ['widget', w]), ...(p.boxes ?? []).filter((b) => b.kind === 'widget' || b.kind === 'card').map((b) => [b.kind, b])].filter(([, w]) => !(EDGES.includes(w.anchor) || (typeof w.anchor === 'string' && w.anchor[0] === '@' && ids.has(w.anchor.slice(1)) && w.anchor.slice(1) !== w.id))).map(([k, w]) => `${p.id} ${k} "${w.id}": anchor is ${JSON.stringify(w.anchor)}, so it floats. Fix: anchor to a frame edge (${EDGES.join(', ')}) or to a box in the same panel ("@<box id>").`); });
  }},
  {n: 14, id: 'placeholder', stage: 'script', needs: ['script'], title: 'Zero placeholder strings', run(P) {
    return [...allCopy(P).filter(({text}) => PLACEHOLDER.test(text)).map(({where, text}) => `${where}: "${text.match(PLACEHOLDER)[0]}" is placeholder copy. Fix: write the real line.`), ...sb(P).filter((p) => String(p.slots?.stat?.value) === '42' && p.slots.stat.unit === '%').map((p) => `${p.id}: stat 42 % is the placeholder number. Fix: use the sourced figure from script facts.`)];
  }},
  {n: 15, id: 'overlap', stage: 'storyboard', needs: ['storyboard'], title: 'Zero text bounding-box overlaps', run(P) {
    const E = [];
    for (const p of sb(P)) { const t = boxesOf(p).filter(isText); for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) { const a = t[i], b = t[j]; if ((a.to ?? p.duration) <= (b.from ?? 0) || (b.to ?? p.duration) <= (a.from ?? 0)) continue; const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); if (ox > 0 && oy > 0 && ox * oy > OVERLAP_AREA) E.push(`${p.id}: text boxes "${a.id}" and "${b.id}" overlap by ${ox.toFixed(1)} x ${oy.toFixed(1)}. Fix: move "${b.id}" to y ${(a.y + a.h + 2).toFixed(0)}, or give them separate from/to times.`); } }
    return E;
  }},
  {n: 16, id: 'contrast', stage: 'storyboard', needs: ['storyboard', 'ds'], title: 'WCAG AA contrast floor', run(P) { return [...checkSystem(P.ds, 'design system').filter((e) => /:1; needs/.test(e)), ...checkPlan(P).contrast]; }},
  {n: 17, id: 'safe-zone', stage: 'storyboard', needs: ['storyboard'], title: '9:16 safe zones: bottom 20%, right 15%', run(P) { return checkSafe(P); }},
  {n: 18, id: 'widgets', stage: 'storyboard', needs: ['storyboard'], title: 'At least 1 micro-widget per 2 scenes', run(P) {
    const count = P.scenes.map((sc) => (sc.panels ?? []).reduce((n, p) => n + (p.widgets ?? []).length, 0)), E = [];
    if (count.length === 1 && !count[0]) E.push(`scene ${P.scenes[0].id} has no widget. Fix: add one to a panel: "widgets": [{"id": "<widget id>", "anchor": "tr", "at": 0.5, "easing": "<named>"}].`);
    for (let i = 0; i + 1 < count.length; i++) if (!count[i] && !count[i + 1]) E.push(`scenes ${P.scenes[i].id} and ${P.scenes[i + 1].id} have no micro-widget between them. Fix: add one to a panel in either scene.`);
    const lib = path.join(SKILL, 'library', 'widgets.json');
    if (fs.existsSync(lib)) { const ids = new Set(readJson(lib).entries.map((e) => e.id)); for (const p of sb(P)) for (const w of p.widgets ?? []) if (!ids.has(w.id)) E.push(`${p.id}: widget "${w.id}" is not in library/widgets.json`); }
    return E;
  }},
  {n: 19, id: 'type-ratio', stage: 'storyboard', needs: ['storyboard'], title: 'Display font at least 2.2x body font', run(P) {
    const E = []; let seen = 0;
    for (const p of sb(P)) {
      const t = boxesOf(p).filter(isText);
      for (const b of t) if (['display', 'body'].includes(b.role) && !(b.px > 0)) E.push(`${p.id} box "${b.id}": ${b.role} text needs "px" (font size on the real frame).`);
      const d = Math.max(0, ...t.filter((b) => b.role === 'display').map((b) => b.px || 0)), bo = Math.max(0, ...t.filter((b) => b.role === 'body').map((b) => b.px || 0));
      if (d && bo) { seen++; if (d / bo < TYPE_RATIO) E.push(`${p.id}: display ${d} px / body ${bo} px = ${(d / bo).toFixed(2)} (needs ${TYPE_RATIO}). Fix: display >= ${Math.ceil(bo * TYPE_RATIO)} px, or body <= ${Math.floor(d / TYPE_RATIO)} px.`); }
    }
    const ts = P.ds?.type_scale;
    if (!seen && !E.length && !(ts?.display / ts?.body >= TYPE_RATIO)) E.push(`no panel has both display and body text with px, and the design system type_scale does not prove the ratio. Fix: set role and px on text boxes.`);
    return E;
  }},
  {n: 20, id: 'orphan', stage: 'storyboard', needs: ['storyboard'], title: 'No single-word line orphans of 3 characters or fewer', run(P) {
    return sb(P).flatMap((p) => boxesOf(p).filter((b) => isText(b) && b.text).flatMap((b) => { const ls = linesOf(b, P.W).map((l) => l.trim()).filter(Boolean); return ls.length < 2 ? [] : ls.filter((l) => words(l).length === 1 && l.replace(/[^\p{L}\p{N}]/gu, '').length <= ORPHAN_CHARS).map((l) => `${p.id} box "${b.id}": the line "${l}" is a lone short word. Fix: set "lines" so it joins a neighbour, or widen w.`); }));
  }},
  {n: 21, id: 'interrupt', stage: 'final', needs: ['storyboard'], title: 'Visual pattern interrupt within the first 1.5 s', run(P) {
    const max = Math.round(INTERRUPT_SECONDS * P.fps);
    return P.events.some((e) => e.f > 0 && e.f <= max) ? [] : [`no visual event between frame 1 and ${max} (first ${INTERRUPT_SECONDS} s). Fix: add a beat to ${sb(P)[0]?.id} with "at" between 0.3 and ${INTERRUPT_SECONDS} (a scale snap, swap or camera move), or cut to panel 2 by then.`];
  }},
  {n: 22, id: 'transitions', stage: 'final', needs: ['storyboard'], title: 'Max 2 consecutive identical transitions', run(P) {
    const lib = transitionIds(), seq = sb(P).slice(1).map((p) => p.transition?.id ?? p.fx.find((e) => lib.has(e.effect_id) && !(e.start > 0))?.effect_id ?? 'cut'), E = [];
    let run = 1;
    for (let i = 1; i < seq.length; i++) { run = seq[i] === seq[i - 1] && seq[i] !== 'cut' ? run + 1 : 1; if (run === SAME_TRANSITIONS + 1) E.push(`"${seq[i]}" is used ${run} times in a row, ending at ${sb(P)[i + 1].id} (max ${SAME_TRANSITIONS}). Fix: change this one, or make it a plain cut.`); }
    return E;
  }},
  {n: 23, id: 'sfx-sync', stage: 'final', needs: ['storyboard'], title: 'SFX within 2 frames of a keyframe', run(P) {
    const keys = [...new Set(P.events.map((e) => e.f))], E = [];
    for (const sc of P.scenes) if (!P.sfx.some((s) => s.scene === sc.id)) E.push(`scene ${sc.id} has no sound cue. Fix: add "sfx": [{"id": "<sound id>", "at": 0}] to a panel, on its cut or a beat.`);
    for (const s of P.sfx) { const near = keys.reduce((b, k) => (Math.abs(k - s.f) < Math.abs(b - s.f) ? k : b), keys[0]); if (!(Math.abs(near - s.f) <= SFX_FRAMES)) E.push(`sfx "${s.id}" at frame ${s.f} is ${Math.abs(near - s.f)} frames from the nearest keyframe (${near}); max ${SFX_FRAMES}. Fix: move it to frame ${near} (${((near - (sb(P).find((p) => p.id === s.at)?.start ?? 0)) / P.fps).toFixed(2)} s into ${s.at}).`); }
    return E;
  }},
  {n: 24, id: 'verify', stage: 'script', needs: ['script'], title: '[VERIFY] on unsourced claims', run(P) {
    const E = [];
    for (const s of P.script.scenes ?? []) {
      for (const f of s.facts ?? []) { if (!String(f.source ?? '').trim() && f.status !== 'VERIFY') E.push(`script ${s.id}: fact "${f.claim.slice(0, 50)}" has no source but status "${f.status}". Fix: add the source, or set status to "VERIFY".`); }
      for (const t of [...sentences(s.narration), s.on_screen_text ?? '']) if (/\d/.test(t) && !(s.facts ?? []).length && !/\[VERIFY/.test(t)) E.push(`script ${s.id}: "${t.slice(0, 60)}" states a number but the scene has no fact entry. Fix: add {"claim", "status": "VERIFY", "source": ""} to facts, or a real source.`);
      if ((s.facts ?? []).some((f) => f.status === 'VERIFY') && /\d/.test(s.on_screen_text ?? '')) E.push(`script ${s.id}: on_screen_text shows a number while a fact is still VERIFY. Fix: keep unverified numbers off screen.`);
    }
    return E;
  }},
  {n: 25, id: 'design-lock', stage: 'storyboard', needs: ['storyboard', 'ds'], title: '100% single design-system.json compliance', run(P) { return checkPlan(P).lock; }},
];

const ORDER = ['script', 'storyboard', 'final'];
const FILE = {script: 'script.json', storyboard: 'storyboard.json', ds: 'styles/<brief.style>/design-system.json'};

function runAll(P, stage = 'final') {
  return RULES.filter((r) => ORDER.indexOf(r.stage) <= ORDER.indexOf(stage)).map((r) => {
    const miss = r.needs.filter((k) => (k === 'storyboard' ? !P.panels.length : !P[k]));
    // a script-stage run has no storyboard yet; its rules read whatever copy exists
    let errs;
    try { errs = miss.length ? [`cannot run: ${miss.map((k) => FILE[k]).join(', ')} is missing or empty`] : r.run(P); } catch (e) { errs = [`rule crashed on this input: ${e.message}`]; }
    return {n: r.n, id: r.id, title: r.title, pass: !errs.length, errs};
  });
}

function report(res, label) {
  for (const r of res) { const nn = String(r.n).padStart(2, '0'); if (r.pass) console.log(`PASS ${nn} ${r.id}`); else r.errs.slice(0, 6).forEach((e) => console.error(`FAIL ${nn} ${r.id}: ${e}`)), r.errs.length > 6 && console.error(`FAIL ${nn} ${r.id}: ... and ${r.errs.length - 6} more of the same rule`); }
  const bad = res.filter((r) => !r.pass);
  console.log(`${bad.length ? 'FAIL' : 'PASS'} ai-tells ${label}: ${res.length - bad.length}/${res.length} rules pass${bad.length ? `; failing: ${bad.map((r) => r.n).join(', ')}` : ''}`);
  return bad.length;
}

module.exports = {RULES, runAll};

if (require.main === module) {
  const a = args();
  if (a.list) { RULES.forEach((r) => console.log(`${String(r.n).padStart(2, '0')} ${r.id.padEnd(16)} ${r.stage.padEnd(11)} ${r.title}`)); process.exit(0); }
  if (a.selftest) {
    const fx = (n) => path.join(__dirname, 'fixtures', n), ld = (n) => load(fx(n), {ds: path.join(fx(n), 'design-system.json')});
    const good = runAll(ld('tells-pass')), bad = runAll(ld('tells-fail'));
    const wrongPass = good.filter((r) => !r.pass), wrongFail = bad.filter((r) => r.pass);
    wrongPass.forEach((r) => console.error(`FAIL selftest: rule ${r.n} ${r.id} fails on the good fixture: ${r.errs[0]}`));
    wrongFail.forEach((r) => console.error(`FAIL selftest: rule ${r.n} ${r.id} does not fire on the bad fixture`));
    if (RULES.length !== 25) console.error(`FAIL selftest: ${RULES.length} rules, expected 25`);
    if (wrongPass.length || wrongFail.length || RULES.length !== 25) process.exit(1);
    console.log('PASS selftest: 25/25 rules pass on fixtures/tells-pass and 25/25 fire on fixtures/tells-fail');
    process.exit(0);
  }
  if (!a._[0]) { console.error('Usage: node check-ai-tells.js <work-dir> [--stage script|storyboard|final] [--ds file] [--json] | --list | --selftest'); process.exit(2); }
  const stage = ORDER.includes(a.stage) ? a.stage : 'final';
  const res = runAll(load(a._[0], {ds: typeof a.ds === 'string' ? a.ds : undefined}), stage);
  if (typeof a.out === 'string') { fs.mkdirSync(path.dirname(a.out), {recursive: true}); fs.writeFileSync(a.out, JSON.stringify({stage, pass: res.every((r) => r.pass), rules: res}, null, 1) + '\n'); }
  if (a.json) { console.log(JSON.stringify({stage, pass: res.every((r) => r.pass), rules: res}, null, 1)); process.exit(res.every((r) => r.pass) ? 0 : 1); }
  process.exit(report(res, `(${stage})`) ? 1 : 0);
}
