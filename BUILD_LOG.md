# BUILD_LOG

Read this first when resuming. Newest state at the top of each section.

## State
- **2026-11-14 prompt 04: Scriptwriter persona.** `personas/scriptwriter.md` (144 lines) replaces
  `roles/writer.md` (moved, then rewritten): retention mechanics, 3 hook formulas with bad/good
  rewrites, But/Therefore chaining, caption and cadence rules, [VERIFY] rules, 10-row works/fails
  table, worked 35 s Nokia script (`scripts/fixtures/scriptwriter-nokia/`, checked by the static
  check with `validate.js` and `check-ai-tells.js --stage script`).
  Script schema gains optional `fps`, `hook {formula, belief, gap}`, scene `rehook`, scene `captions`
  as `[from_frame, to_frame, text, power_word]`. `validate.js` now FAILS a script with no hook or
  re-hook start for over 10 s before the payoff, a re-hook that does not open on a turn word, or
  captions that are over 5 words, out of order, outside the scene, not equal to the narration, or
  without a power word; missing `hook` or `captions` is a WARN for now. Rule 1 opener regex also bans
  "In this video", "Today we", "Welcome", "Hey guys", "Let's talk", "Have you ever", "Did you know"
  (`references/ai-tells.md` rule 1 text not yet updated to list them).
  Persona line cap is now 110-160. Storyboard and engine do not read script `captions` yet.
- **2026-11-14 prompt 03: Director persona.** `personas/director.md` (146 lines) replaces
  `roles/director.md` (moved, then rewritten): short-form philosophy, the 4-question interview with
  platform-to-ratio table, focused/expanded palette tier rule (entity count decides), seeded variation,
  the 8-persona dispatch matrix (one manual, at most two inputs), 8-row works/fails table, and the
  worked Nokia brief (`scripts/fixtures/director-nokia/brief.json`, validated by the static check).
  Brief schema gains optional `ratio`, `subject_mode`, `angle`, `design.palette_tier`;
  `pick-design.js` chooses only within the tier; `validate.js` checks tier and subject mode against
  the design system. Static check caps `personas/*.md` at 110-150 lines. The other 7 personas still
  live in `roles/` as old versions.
- **2026-11-14 prompt 02: legacy purged, validators in.** The skill has **0 built styles** and cannot
  render a film until styles are rebuilt. What exists now:
  - `SKILL.md` (router, under 110 lines): 4 questions, one file to read per stage, scripts per stage.
  - `references/style-cheatsheet.md`: the 12 new style ids (look, best for, subject mode).
  - `references/ai-tells.md`: the 25 rules with fail/pass examples and the panel fields they read.
  - `scripts/check-ai-tells.js` (25 rules, `--stage`, `--selftest`, `--out`), `scripts/check-design.js`
    (contrast 4.5 body / 3.0 display, palette lock, new design-system shape), `scripts/check-safezones.js`
    (bottom 20% / right 15% on 9:16), `scripts/plan.js` (shared loader).
  - `scripts/fixtures/tells-pass/` passes 25/25; `scripts/fixtures/tells-fail/` trips 25/25.
  - `node scripts/check-static.js` PASS (runs the selftest too).
  OWED next:
  - Build the 12 styles: `styles/<id>/design-system.json` (shape = the tells-pass fixture),
    `styles/<id>/style.md` (100-160 lines; it is ALSO the storyboard manual, SKILL.md stage 5 reads
    only that file), `components/styles/<id>/kit.tsx`, registered in `components/styles/index.ts`.
  - Engine does not yet draw `boxes`, `beats`, `widgets`, `sfx`, `transition` (new optional storyboard
    fields; the validators read them, `build-film.js` and `Film.tsx` ignore them). The 9 closed
    layouts and the stick rig `components/engine/figure.ts` are still in the engine.
  - Widget library (50) and its id list; rule 18 checks ids against it once it exists.
  - Role files are still the old 57-73 line versions; `roles/storyboard.md` is no longer routed to.
  - `previews/` (24 legacy sheets) kept as post-mortem evidence; delete when no longer wanted.
- **2026-11-14 HALT + ARCHITECTURE LOCK (prompt 01).** The preview/template build is stopped. Read
  `.claude/skills/film-studio/POST_MORTEM.md` before any other work: 6 failure modes, 7 laws, and the
  3-layer progressive-disclosure contract. Do not run `scripts/preview.js`, do not render more sheets,
  do not extend the 12 old styles. Nothing deleted yet. The Step 3/4 lines below describe the
  superseded build and are kept as history only.
- Step 1 Audit: DONE (AUDIT.md pass 1). Second pass owed at the end.
- Step 2 Baseline: scripts, storyboards and TSX written (`baseline/`, `components/baseline/`); stills NOT rendered yet (deferred by the user until the skill is complete).
- Step 3 Styles: 12 kits + 12 design systems built, registered, type-check clean, `check-design.js --systems` PASS.
  Sheets rendered on the default palette for all 12 (`previews/<style>/<palette>-sheet.png`).
  OWED per style: style.md, recipes.md, failures.md, rubric.md; a second-palette sheet; reviewer verdict; `status: verified`.
- Step 4 Everything else: NOT DONE. No SKILL.md exists. validate.js is old. Effects library is empty
  (`components/effects/index.ts`), `library/vfx/*.json` not wired. ledger/credits/check-render/pick-design scripts missing.
- Step 5 4/10 vs 8/10 test: not started (last, by user instruction).

## User instructions that override the brief's order
- Finish the whole skill (styles included) before making any example or topic video.
- Kit checks use the neutral specimen (`library/preview.json`), never a topic film.
- Tests and reviews run as subagents with `model: sonnet`, `effort: low`. Authors never self-score.

## The 12 styles
whiteboard, cartoon, infographic, kinetic, comic, sketchbook, pixel, cutout, watercolor, noir, blueprint, riso.
All `requires: none` (code-drawn, no generation API).

## Environment facts
- Project root: `m:\ABC\Claude Skills\film-studio`; skill at `.claude/skills/film-studio/`
- Node 22.19, ffmpeg/ffprobe on PATH, Remotion 4.0.543 in `components/`
- Type-check: `cd components && ./node_modules/.bin/tsc --noEmit -p .` (npx tsc from the skill root fails)
- Sheet: `node scripts/preview.js <style> [--palette id]` (about 40 s)
- Design systems are generated from scratch scripts; edit the JSON directly from now on.
- Git repo; remote `origin` = github.com/manasshah1810/film-studio. Work on local branch `clean-main`,
  which tracks `origin/main`. Local `main` is a stale, diverged branch (old history with the large
  binary): do not push it.

## Engine facts worth knowing
- One `Film` composition driven by film.json; `Sheet` composition for contact sheets.
- Closed layouts: title, stat, figure, versus, chart, object, quote, timeline, list.
- Kit contract in `components/engine/types.ts` (`Kit`); factories in `engine/base.tsx`.
- A Google font's CSS family can differ from its Google name ("Press Start 2P" registers as
  "Press Start TwoP"); `CSS_FAMILY` in `engine/tokens.ts` maps it at load.
- check-design near-duplicate rule: two palettes fail if bg distance < 28 and primary distance < 40.

## Open [CHECK] items
- Official Claude Code skill frontmatter field list (checked via third-party summaries only)
- Hyperframes CLI flags
- Platform safe-zone numbers (third-party)

## Log
- 2026-11-14: prompt 04 done. Scriptwriter persona, script schema fields, re-hook and caption checks.
- 2026-11-14: prompt 03 done. Director persona, brief schema fields, tier-aware pick-design.
- 2026-11-14: prompt 02 done. Deleted 12 legacy `styles/` folders, 12 kits, shared preview
  (`library/preview.json`, `scripts/preview.js`), `rubrics/ai-tells.md` (28 tells) and the `ai-checker`
  agent. Added router SKILL.md, two references, three validators, fixtures. Schemas extended
  (storyboard panel: boxes, beats, widgets, captions, sfx, transition; vfx-plan: sfx, easing; cast:
  layers). Stage 7 is now a script.
- 2026-11-14: prompt 01 done. Preview loop confirmed not running; skill folder inventoried (no
  deletions); POST_MORTEM.md written (6 failures, 7 laws, 3-layer contract). NEXT: rebuild under the
  laws, starting with SKILL.md as the under-110-line router and the validators.
- 2026-11-13 (late): watercolor, noir, blueprint, riso kits and design systems added; 12/12 pass.
- 2026-11-13: comic, sketchbook, pixel, cutout added; font alias fix.
- 2026-11-13: engine, whiteboard, cartoon, infographic, kinetic built; specimen sheet replaces topic fixtures.
- 2026-11-13: audit read of all 128 files; toolchain test render OK; docs checks done.
- 2026-11-13 (checkpoint): Step 4 built. 86 effects with components, schemas + validate.js, scripts
  (pick-design, ledger, credits, state, voice, render, check-render, check-static, cast-sheet), SKILL.md,
  10 roles, 6 rubrics, 3 reviewer agents, README, DECISIONS. `node scripts/check-static.js` PASS
  (12 styles, 86 effects, 76 docs, type-check ok). Worked example validates and renders stills.
  NEXT: second-palette sheets, reviewer scoring per style (sonnet/low subagents, max 3 rounds), set
  `status: verified`, doc review, AUDIT pass 2, then Step 5 comparison and FINAL_REPORT.md.
