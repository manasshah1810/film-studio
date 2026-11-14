# BUILD_LOG

Read this first when resuming. Newest state at the top of each section.

## State
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
