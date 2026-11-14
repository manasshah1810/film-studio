# BUILD_LOG

Read this first when resuming. Newest state at the top of each section.

## State
- **2026-11-14 prompt 12: neo-brutalist-ui style, status: verified.** Added `styles/neo-brutalist-ui/`
  (`style.md` 111 lines, `design-system.json` 5 focused + 5 expanded palettes, 6 font pairings, border,
  offset-shadow and backdrop-blur tokens, `recipes.md`, `failures.md`) and
  `components/styles/neo-brutalist-ui/Preview.tsx` (tactile creator workspace: gravity-drop window, PromptBar
  with Keycaps, LiveCursor, 3D axis flip to an NLETimeline, two frosted glass metric cards). Registered in
  `components/Root.tsx` as `Preview-neo-brutalist-ui` and `PreviewSheet-neo-brutalist-ui` (needed to render it).
  Visual loop: Pass 1 rendered `butter-ink` and `night-shift` (3-beat sheet each, stills only,
  `previews/neo-brutalist-ui/` (repo root)). Critique: sub-line collided with the keycaps, timeline touched the card
  edge, cursor covered the Generate label and a metric chip, "GENERATE" overflowed in the wide accent face.
  Pass 2: window 33% to 36% tall, glass cards moved down 2 points, cursor aimed at empty corners, button label
  in the body face. `check-design.js` and `check-safezones.js` PASS on both, `--systems` PASS, `tsc` clean.
  One render stop: Space Mono has no weight 500, set to 400 in the data and re-rendered once.
  Choices where the prompt gave no number: palette ids and colours, the 6 pairings, spring values, glass fill
  alpha 0.74 and saturate 1.4, radius 10/8/6, and `frame_scale` 3 (tokens kept as the prompt's 3 px border,
  5 px shadow, in design px on a 360 x 640 canvas, so they are 9 px and 15 px on the 1080 frame).
  PostWall, PromptBar, Keycaps, NLETimeline, LiveCursor are documented in `style.md`; the specimen draws
  PromptBar, Keycaps, NLETimeline and LiveCursor inline, no shared widget components were added.
  `check-static.js` is expected to fail for this style the same way as hormozi-kinetic (no `kit.tsx`, not in
  `components/styles/index.ts`, no `style-rules.json` entry): the prompt did not ask for them.
- **2026-11-14 prompt 11: hormozi-kinetic style, status: verified.** Added `styles/hormozi-kinetic/`
  (`style.md` 111 lines, `design-system.json` 5 focused + 5 expanded palettes and 6 font pairings,
  `recipes.md`, `failures.md`) and `components/styles/hormozi-kinetic/Preview.tsx`, registered in
  `components/Root.tsx` as `Preview-hormozi-kinetic` and `PreviewSheet-hormozi-kinetic` (needed to render it).
  Visual loop: Pass 1 rendered `blackout-gold` and `paper-red` (3-beat sheet each, stills only,
  `previews/hormozi-kinetic/`); `check-design.js` and `check-safezones.js` PASS on both. Critique: headline
  filled only 2/3 of its box and the raised hand read as a stub. Pass 2: display size 0.93x to 1.0x, bigger
  hand, rule moved to y 50; re-rendered, both checks PASS again, `tsc` clean. Choices where the prompt gave
  no number: palette ids and colours, the 6 pairings, spring values, the comment copy "@marcus_builds",
  `subject_mode: layered` (the prompt asks for a Mode A bust; `references/style-cheatsheet.md` lists this
  style as ui-first, left unchanged). The hook keeps the em dash exactly as written in the prompt.
  Checks ran on a scratch storyboard that mirrors `BOXES` in Preview.tsx (not committed).
  Known: `node scripts/check-static.js` now FAILS 4 ways because it expects things the prompt did not ask
  for: no `components/styles/hormozi-kinetic/kit.tsx`, not registered in `components/styles/index.ts`, no
  entry in `library/vfx/style-rules.json`, and the example brief names style `sketchbook`, which has no
  design system. Left untouched.
- **2026-11-14 prompt 10: QA inspector manual only.** Added `personas/qa-inspector.md`: Stage 1
  four-script hard-fail gate, Stage 2 10-parameter rubric (9.0 average, none under 7), 2-pass visual
  critique with rework handoff line, 8-row works/fails table, worked Nokia audit report. Nothing else
  changed. Note: the prompt names `validate-schema.js`; no such script exists, the schema check in the
  repo is `scripts/validate.js`, and the manual says so.
- **2026-11-14 prompt 09: sound designer manual only.** Added `personas/sound-designer.md` (109 lines):
  +/-2 frame sync contract, motion and widget to SFX table, pacing rules (riser, 12-18 frame silence
  drop, -18 dB duck), 8-row works/fails table, worked Nokia cue sheet (19 cues). Nothing else changed.
  The prompt gave 6 sound mappings; the other table rows, duck attack/release times, riser lead and
  level numbers are choices made in the manual. No validator or engine reads the cue sheet shape.
- **2026-11-14 prompt 08: motion choreographer manual only.** Added `personas/motion-choreographer.md`
  (111 lines): 105-frame state-change law, Zero Dead Velocity, 4-phase energy curve, 9-primitive pairing
  guide with per-film limits, 8-row works/fails table, worked Nokia timeline (18 resets, largest gap 75
  frames). Nothing else changed. The per-film limits, drift/parallax/breathing numbers and phase spacings
  are choices made in the manual (the prompt gave none); no validator or engine reads the timeline shape.
- **2026-11-14 prompt 07: widget integrator manual only.** Added `personas/widget-integrator.md`
  (135 lines): proof principles, 50-widget lookup table (10 per category), token contract, 9:16 safe-zone
  rules, 8-row works/fails table, worked Nokia placement sheet. Nothing else changed.
  Notes: `components/widgets/` does not exist yet, so the 50 widget names are defined by this manual
  (5 from the prompt, 45 chosen to fill the categories); the token contract names `border_width` and
  `radius`, which the current design-system shape does not have; the placement sheet is not a storyboard
  schema shape (it carries `scene`, `panel`, `box`, `tokens`, `proves`).
- **2026-11-14 prompts 03-06: four persona manuals only.** Added `personas/director.md` (146 lines),
  `personas/scriptwriter.md` (144), `personas/casting-rig-designer.md` (123) and
  `personas/art-director.md` (112), each with the worked JSON its prompt asked for. Nothing else was
  changed: an earlier pass that also edited schemas, validators, fixtures, SKILL.md and moved `roles/`
  files was reverted at the user's request, and `roles/*.md`, SKILL.md and the scripts are back to the
  prompt 02 state.
  Known mismatches the next prompts must settle: SKILL.md still routes to `roles/*.md`, not to the
  four persona files; the worked JSON uses fields the schemas do not accept yet (brief `ratio`,
  `subject_mode`, `angle`, `design.palette_tier`; script `hook`, `rehook`, `captions` as arrays; cast
  `mode`, `seed`, `variant_of`, `rig`), so `validate.js` rejects them; the manuals' pre-existing roles
  (`roles/writer.md`, `roles/talent-acquisition.md`, `roles/storyboard.md`, `roles/director.md`) still exist.

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
- 2026-11-14: prompt 12 done (neo-brutalist-ui style, verified).
- 2026-11-14: prompt 11 done (hormozi-kinetic style, verified).
- 2026-11-14: prompt 10 done (QA inspector manual).
- 2026-11-14: prompt 09 done (sound designer manual).
- 2026-11-14: prompt 08 done (motion choreographer manual).
- 2026-11-14: prompt 07 done (widget integrator manual).
- 2026-11-14: prompts 03-06 done as four manuals; extras reverted on request.
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
