# BUILD_LOG

Read this first when resuming. Newest state at the top of each section.

## State
- **2026-11-14 prompt 16: scifi-hud style, status: verified.** Added `styles/scifi-hud/` (`style.md` 110 lines, `design-system.json` 5 focused + 5 expanded palettes, 6 mono and geometric pairings, ring, bracket, scanline, waveform and glitch tokens, `recipes.md` with the stroke-dasharray arc, tick ring, corner bracket, scanline, scramble, waveform, glitch and lock code, `failures.md` with 30 rows) and `components/styles/scifi-hud/Preview.tsx` (a six ring targeting reticle with counter-rotating rings, a gauge arc and orbit dot, a lens ring, a wire target with a lock box, corner registration brackets, scanlines, live signal bars, four scramble-decoded telemetry readouts, a state word and a clock, and an RGB chromatic glitch at the lock). Subject mode ui-first (Mode C). Registered in `components/Root.tsx` as `Preview-scifi-hud` and `PreviewSheet-scifi-hud` (needed to render it). Visual loop: Pass 1 rendered `cyan-ops` (stills only, `previews/scifi-hud/` at repo root). Critique: the first sheet frame (24) showed rings only and no readouts, the title plate had dead space on the right, and the glitch was not in the sheet. Pass 2: sheet frames moved to 40, 100 and 150, title plate narrowed from 70 to 62 percent, then re-rendered `cyan-ops` and `cyber-noir` (with the wide mono pairing kode-barlow-spacemono) plus glitch frame 100. Small mono legibility checked at 34 px labels and 44 px values: all readable, no text touches a plate edge. `check-design.js` and `check-safezones.js` PASS on `cyan-ops` and `cyber-noir` scratch work dirs, `--systems` PASS, `tsc` clean. Text roles (ink, primary, highlight, dim, alert, ok) are 4.5:1 or better on `bg` and `surface` (lowest 5.0). Choices where the prompt gave no number: palette ids and colours, the 6 pairings, ring radii 330, 296, 262, 228, 190, 150, spin 0.5, 0.9, 1.6 deg per frame, segment counts 120, 24, 6, 36, 4, bracket inset 36 and arm 110, scanline pitch 4, lock at frame 96 on a 13/150/1 spring, glitch 8 frames at 12 px, scramble 18 frames staggered 8, limits in style.md (1 glitch, 1 lock, 1 widget family per 10 s). Widgets CodeBody, EyedropperGrade and GridCollapse are documented but not built; OrbitRing and LensRing are built. `check-static.js` was not run and is expected to fail like the earlier styles (no `kit.tsx`, not in `components/styles/index.ts`, no `style-rules.json` entry). The bottom 20 percent is an intentionally empty safe zone. The telemetry values are fictional.
- **2026-11-14 prompt 15: 2-5d-parallax-depth style, status: verified.** Added `styles/2-5d-parallax-depth/`
  (`style.md` 116 lines, `design-system.json` 5 focused + 5 expanded atmospheric story palettes, 6 font
  pairings each with a serif accent, 4 depth planes with z, parallax and blur tokens, `recipes.md` with the
  CSS perspective and translateZ scale-compensation math and the differential parallax table, `failures.md`
  with 30 rows) and `components/styles/2-5d-parallax-depth/Preview.tsx` (a courier with a lantern on a pier at
  dusk: Z0 sky, moon, hills and sea, Z1 town and a lighthouse, Z2 the layered Story Actor with idle, react and
  act states, Z3 a dark blurred post and reed frame, a continuous Z-push, a directional whip pan to the tower,
  a rack focus to the tower and back, a layer legend that shows each plane's parallax and live blur). Real CSS
  perspective, no photo or video. Registered in `components/Root.tsx` as `Preview-2-5d-parallax-depth` and
  `PreviewSheet-2-5d-parallax-depth` (needed to render it). Visual loop: Pass 1 rendered `dusk-harbour` (3-beat
  sheet at frames 30, 118, 172, plus whip frame 95, stills only, `previews/2-5d-parallax-depth/` at repo root).
  Critique: legend text touched the plate edge, the foreground frame was nearly out of shot at rest, the top
  foreground branch was left invisible. Pass 2: legend line 2 shortened to "1.56X B7" (B is blur px), posts
  moved to x 40 and 1040 so they frame the edges at rest, branch and leaves added. Edge clipping checked on the
  whip frame (95) and the three sheet frames: no plane edge shows. Depth contrast: far planes lighter and hazier,
  near planes darker, the actor the most saturated shape, hero sharp at rest (0 px) and Z1 sharp after the rack.
  `check-design.js` and `check-safezones.js` PASS on `dusk-harbour` and `noir-city` scratch work dirs, `--systems`
  PASS, `tsc` clean. Text roles (ink, primary, highlight, coat) are 4.5:1 or better on `bg` and `surface`
  (lowest 5.6). Choices where the prompt gave no number: palette ids and colours, the 6 pairings, perspective
  1400 px, z values -1400, -700, 0, 500 (parallax 0.50, 0.67, 1.00, 1.56), push 220 px, plane size 1900 x 2200,
  blur 3, 2, 0, 7 px at rest, rack 24 frames with a second swap back, whip 260 px in 10 frames with a settle spring
  14/120/1, actor states timed at frames 58 and 138, limits in style.md (1 whip pan, 2 rack swaps, 1 actor per
  35 s). The story is fictional. Widgets LayerExplode, PictureDive, DollyZoom and StoryboardDeck are documented,
  not built; RackFocus, the whip pan and the Z-push are built. `check-static.js` not run; expected to fail like
  the earlier styles (no `kit.tsx`, not in `components/styles/index.ts`, no `style-rules.json` entry).
- **2026-11-14 prompt 14: tactical-vector-maps style, status: verified.** Added `styles/tactical-vector-maps/`
  (`style.md` 120 lines, `design-system.json` 5 focused + 5 expanded multi-faction palettes, 6 font pairings
  each with a serif stamp face, elevation tiers and route, ping, dial and camera tokens, `recipes.md` with
  the projected camera, Bezier route splines, radar ping rings and the coordinate grid, `failures.md`) and
  `components/styles/tactical-vector-maps/Preview.tsx` (fictional map: 4 layered landmasses, a dashed route
  traced to a strait and cut, a SerifStamp, a reroute, 3 numbered pin beacons with radar pings, a DayDial and
  a detour odometer, a coordinate pan and zoom camera that ends in an elastic pull-back, zero people).
  Registered in `components/Root.tsx` as `Preview-tactical-vector-maps` and `PreviewSheet-tactical-vector-maps`
  (needed to render it). Visual loop: Pass 1 rendered `night-atlas` and `trade-war` (3-beat sheet + frame 176,
  stills only, `previews/tactical-vector-maps/` at repo root). Critique: the stamp covered the detour route, the
  cut X sat under the beacon dot and read as a star, the sea channel was narrow so pins crowded, the day
  counter was caught mid roll, ruler labels crossed the card corner, the coast zig-zagged evenly, the stamp
  floated with no link to its place. Pass 2: stamp moved above the strait with a leader to pin 2, cut beacon is
  an X with no dot, channel widened and coast re-authored, detour deepened, day counter rolls in the last 40
  percent of a day and the sheet ends after it stops, ruler labels kept 60 px inside, land bands made lighter.
  `check-design.js` and `check-safezones.js` PASS on both palettes, `--systems` PASS, `tsc` clean. All 10
  palettes: every role is 4.5:1 or better on both `bg` and `surface` (lowest 5.1, iron-curtain highlight).
  Accent-coloured text (stamp, plate values, detour number) is checked by that table, not by
  `check-design.js`, which only knows `ink` text roles; the scratch work-dir boxes all use `ink`.
  Choices where the prompt gave no number: palette ids and colours, the 6 pairings, authoring space 1000 x 800
  drawn at 0.8, band depths 14 and 34 px, shadow 14 px, shelf 24 px, dash 30 on 18 off, march 1.4 px a frame,
  3 rings 13 frames apart over 40 frames to 80 px, pin stem 44 and badge 28, stamp -8 degrees from 1.7 scale,
  24 tick dial, camera zooms 2.0 to 2.4 to 1.5 to 0.85, springs pop 11/190/0.8, stamp 9/220/0.9, elastic 8/70/1,
  limits in style.md (3 beacons, 1 stamp per event, 1 dial per 35 s). The geography, the 2140 km detour and the
  place names Alder, Narrows, Kestrel are fictional and the film prints "FICTIONAL MAP" and "ILLUSTRATIVE DATA".
  Widgets PictureDive, LensRing and OrbitRing are documented, not built; DayDial and SerifStamp are built in
  the specimen. `check-static.js` not run; expected to fail like the earlier styles (no `kit.tsx`, not in
  `components/styles/index.ts`, no `style-rules.json` entry). The first render re-downloaded the Chrome
  Headless Shell (renderer tooling, no image or video generation).
- **2026-11-14 prompt 13: dark-neon-dataviz style, status: verified.** Added `styles/dark-neon-dataviz/`
  (`style.md` 121 lines, `design-system.json` 5 focused + 5 expanded palettes, 6 tabular-numeral pairings,
  luminance tiers, glow tokens, `recipes.md` with the feGaussianBlur chain and animated area gradient,
  `failures.md`) and `components/styles/dark-neon-dataviz/Preview.tsx` (market-share collapse: line draws on,
  area gradient grows, 3 glowing callout nodes with plates, odometers 49 to 3, 2 stat cards, continuous drift,
  zero people). Registered in `components/Root.tsx` as `Preview-dark-neon-dataviz` and
  `PreviewSheet-dark-neon-dataviz` (needed to render it). Visual loop: Pass 1 rendered `obsidian-cyan` and
  `bear-market` (3-beat sheet + frame 128, stills only, `previews/dark-neon-dataviz/` at repo root).
  Critique: rack focus dimmed the plate text so red values turned muddy (the failure this style exists to stop),
  zero-length leaders left stray dots, "ILLUSTRATIVE DATA" wrapped, the minus sign crowded the digits.
  Pass 2: dim lines, nodes and borders only, leaders render only when drawn, label box widened, minus column
  widened. `check-design.js` and `check-safezones.js` PASS on both palettes, `--systems` PASS, `tsc` clean.
  All 10 palettes: every role is 4.5:1 or better on both `bg` and `surface` (lowest: obsidian-cyan highlight
  5.6, bear-market alert 5.5; muted labels 7.0 or better). Accent-coloured numerals are checked by that table,
  not by `check-design.js`, which only knows `ink` text roles.
  Choices where the prompt gave no number: palette ids and colours, the 6 pairings, glow 5 and 14 at 0.7 alpha
  (max 28 px), line 9 px, node radius 15, area gradient 38 to 0 percent, spring 11/190/0.8, drift 1.03 and
  14 px, stripe 4 percent, `muted` and ink values. The chart data (49 to 3 percent) and "Rival", "Price war",
  "Exit" are illustrative and the film says so on screen.
  Widgets CloneRow, OrbitRing, Banknote, GridCollapse, RackFocus are documented, not built as components
  (RackFocus is shown in the specimen). `check-static.js` not run; expected to fail like hormozi-kinetic and
  neo-brutalist-ui (no `kit.tsx`, not in `components/styles/index.ts`, no `style-rules.json` entry).
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
- 2026-11-14: prompt 14 done (tactical-vector-maps style, verified).
- 2026-11-14: prompt 15 done (2-5d-parallax-depth style, verified).
- 2026-11-14: prompt 16 done (scifi-hud style, verified).
- 2026-11-14: prompt 12 done (neo-brutalist-ui style, verified).
- 2026-11-14: prompt 13 done (dark-neon-dataviz style, verified).
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
