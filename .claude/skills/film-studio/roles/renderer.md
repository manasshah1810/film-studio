# Renderer

Assembles the approved files into one render input, proves it with stills, makes one short draft,
and renders the final only after the user says yes. One attempt per step: a failure is reported,
not retried.

## Inputs and output
- Reads: `work/brief.json`, `work/cast.json`, `work/storyboard.json`, `work/vfx-plan.json`,
  `work/budget.json`, `work/credits.json`, `work/audio/manifest.json` if a voice was made.
- Writes: `work/film.json`, `work/stills/`, `work/out/draft.mp4`, `work/out/final.mp4`.

## 1. Preconditions (check all, in this order)
1. `node scripts/state.js show work`: script, cast, storyboard, vfx and aicheck are passed or flagged.
2. `node scripts/validate.js --work work` exits 0.
3. `node scripts/credits.js fonts work`, then `node scripts/credits.js check work` exits 0. Any FLAG
   line (trademark) needs the user's yes before going on.
4. Open `[VERIFY]` facts: list them to the Director. Render only after the user has chosen to cut,
   soften or keep each one.
5. If the brief has a voice: `roles/voice.md` has run and `work/audio/manifest.json` exists.

## 2. Build the film file
`node scripts/build-film.js work`
It joins brief, cast, storyboard and VFX plan into `work/film.json`, copies the palette and fonts
from the style's design system by id, and drops unapproved cast. Captions are included when the
platform burns them in or there is no voiceover. Nothing in `film.json` is typed by hand.

## 3. Proof stills (always)
`node scripts/stills.js --film work/film.json --sheet --out work/stills`
One low-resolution contact sheet of every panel. Look at it:
- No empty panel, no clipped or overlapping text, nothing outside the platform safe area.
- The style is unmistakable; captions are present where required.
For a closer look at a few panels: `--panels s1p1,s3p2 --scale 0.4`.
Record: `node scripts/ledger.js spend work render still_render 1 --note "proof sheet"`.

## 4. One draft
`node scripts/render.js work --draft --from <seconds> --seconds 3`
- Three seconds at one-third resolution, starting at the turn or the peak panel.
- `node scripts/check-render.js work --draft`.
- Show the sheet and the draft path to the user. This is the only draft unless the user asks for
  another. Record: `ledger.js spend work render draft_render_per_second 3 --note "draft"`.

## 5. Final
Only after the user approves the sheet and the draft:
1. `node scripts/render.js work --final`
2. `node scripts/check-render.js work --final`: size, frame rate, duration, audio stream, file size
   against the platform limit, and a blank-frame check.
3. Record: `ledger.js spend work render final_render_per_second <seconds> --note "final"`.
4. `node scripts/state.js set work render passed --out work/out/final.mp4`.
5. Hand the Director: the path, the check line, and `node scripts/credits.js text work`.

## 6. What this role never does
- Never edits `film.json`, palette values, fonts or panel content. A problem on the sheet goes back
  to the stage that owns it.
- Never renders full video to check something a still can show.
- Never renders with an unapproved budget (`render.js` refuses).
- Never sees a key. Voice keys are read from the environment by `scripts/voice.js` only.

## 7. Failure
If `build-film.js`, `stills.js`, `render.js` or `check-render.js` exits non-zero:
1. Copy the FAIL lines to the Director exactly.
2. `node scripts/state.js set work render failed --note "<the first FAIL line>"`.
3. Stop. Do not change files to make the error go away and do not run it again.
The usual causes: an unapproved cast id in a panel, a font family missing from
`components/engine/fonts.generated.ts` (run `node scripts/gen-fonts.js`), or `npm install` not run
in `components/`.
