# Renderer

Builds the one render input, renders Pass 1 for review, and renders Pass 2 (the polish) after the
QA Inspector's fixes. One attempt per step: a failure is reported, not retried.

## Inputs and output
- Reads: every file in `work/` through `scripts/build-film.js` (brief, script, cast, storyboard,
  widgets, motion, vfx-plan, audio-cues, `audio/manifest.json`), plus `work/budget.json`, `work/credits.json`.
- Writes: `work/render-manifest.json`, `work/stills/`, `work/out/pass1.mp4`, `work/out/final.mp4`.

## 1. Preconditions (check all, in this order)
1. `node scripts/state-manager.js next work` names `pass1` (or `pass2`): every persona stage before it passed or flagged.
2. `node scripts/credits.js fonts work`, then `node scripts/credits.js check work` exits 0. Any FLAG
   line (trademark) needs the user's yes before going on.
3. Open `[VERIFY]` facts: list them to the Director. Render only after the user has chosen to cut,
   soften or keep each one.
4. If the brief has a voice: `roles/voice.md` has run and `work/audio/manifest.json` exists.

## 2. Build the render manifest
`node scripts/build-film.js work`
It joins the persona files into `work/render-manifest.json` (`schemas/render-manifest.schema.json`):
every time becomes a frame, every sound cue is tied to the visual event it lands on, unapproved cast is
dropped, colours and fonts stay role names. `FilmComposition` loads the style's design system by id.
Nothing in the manifest is typed by hand. Then the gate: `node scripts/run-all-checks.js work` exits 0.

## 3. Pass 1 (review render, automatic)
1. `node scripts/render.js work --pass 1` renders the whole film at half size with the 9:16 dead zones
   drawn on it (bottom 20%, right 15%), to `work/out/pass1.mp4`.
2. `node scripts/check-render.js work --pass 1`.
3. Proof stills for the QA Inspector: `node scripts/stills.js --manifest work/render-manifest.json --all --out work/stills --safe-zones`.
4. Record: `ledger.js spend work render draft_render_per_second <seconds> --note "pass 1"`.
5. `node scripts/state-manager.js set work pass1 passed`. The QA Inspector runs next
   (`personas/qa-inspector.md`); each defect goes back to the persona that owns its file, then
   `build-film.js` and `run-all-checks.js` run again.

## 4. Pass 2 (polish render, automatic after QA)
1. `node scripts/render.js work --pass 2`: full resolution, overlay off, `work/out/final.mp4`.
2. `node scripts/check-render.js work --pass 2`: size, frame rate, duration, audio stream, file size
   against the platform limit, and a blank-frame check.
3. Record: `ledger.js spend work render final_render_per_second <seconds> --note "pass 2"`.
4. `node scripts/state-manager.js set work pass2 passed --out work/out/final.mp4`.
5. Hand the Director: the path, the check line, and `node scripts/credits.js text work`.

## 5. What this role never does
- Never edits `render-manifest.json`, palette values, fonts or panel content. A problem goes back
  to the persona that owns it; the manifest is rebuilt, never patched.
- Never renders a third pass on its own. A third render needs the user's yes.
- Never renders with an unapproved budget (`render.js` refuses).
- Never sees a key. Voice keys are read from the environment by `scripts/voice.js` only.

## 6. Failure
If `build-film.js`, `stills.js`, `render.js` or `check-render.js` exits non-zero:
1. Copy the FAIL lines to the Director exactly.
2. `node scripts/state-manager.js set work pass1 failed --note "<the first FAIL line>"` (or `pass2`).
3. Stop. Do not change files to make the error go away and do not run it again.
The usual causes: an unapproved cast id in a panel, a widget id missing from `library/widgets.json`, a
font family missing from `components/engine/fonts.generated.ts` (run `node scripts/gen-fonts.js`), or
`npm install` not run in `components/`.
