# Decisions

Why the skill is built the way it is. Newest first within each section. Each entry: the decision,
the reason, and what was given up.

## Architecture
1. **One composition, driven by data.** `components/src/compositions/FilmComposition.tsx` renders `work/render-manifest.json`. No role
   writes TSX. Reason: per-film code is where generic output and render failures came from; a closed
   data contract can be validated before anything is drawn. Given up: one-off bespoke shots.
2. **Closed layout vocabulary.** Nine layouts with typed slots (`schemas/storyboard.schema.json`).
   Reason: a prose shot description cannot be rendered or checked. Given up: free-form staging; a
   style may still override a layout in its kit.
3. **Style kits behind one contract.** Every style implements the same `Kit`
   (`components/engine/types.ts`): Backdrop, Headline, Label, Numeral, Marks, Chart, and optional
   Decor, Finish, Bubble. Shared factories live in `components/engine/base.tsx`. Reason: twelve styles
   that differ in drawing, not in plumbing. A character defined once is redrawn by each style.
4. **Design systems are data.** Palettes, pairings, type scale, motion, textures and the figure
   template live in `design-system.json`; kits read numbers from it. `scripts/check-design.js` checks
   counts, contrast pairs, near-duplicate palettes and font availability. Colours are six named roles
   everywhere; no role or kit types a hex.
5. **Deterministic variety.** Palette, pairing, anchors and decoration positions are chosen from a
   seed (the topic), so one brief always gives the same film and two topics in one style do not look
   alike. `Math.random` is not used.
6. **Effects are wrappers.** Each of the 86 effects wraps the finished panel and may transform, filter
   or overlay it (`components/effects/core.tsx`). Time is quantised to the style's hold, so effects
   step on twos or fours without a flag. Given up: effects that reach inside a panel (per-word text
   effects); the kits own those as signature moves.
7. **Styles ban effect tags, not ids.** `library/vfx/style-rules.json` derives each style's banned
   tags from its forbidden list. New effects are covered by their tags automatically.

## Pipeline
8. **Authors never score.** Two reviewer agents with read-only tools score every gated stage from the
   files alone and return JSON; the Director saves it. Reason: self-scoring inflated every score in
   the first audit.
9. **Gate in code where possible.** `scripts/validate-schema.js` checks what a rubric should not have to:
   durations, cast ids, number provenance, per-style limits, banned effects, scorecard arithmetic.
   Reviewers spend their attention on judgement.
10. **Exactly four questions.** Platform, length, style, voiceover. Everything else is decided and
    reported. Reason: the user asked for a film, not an interview.
11. **Budget in units, enforced.** `scripts/ledger.js` refuses spend without an approved dry run and
    refuses to exceed a stage allowance. Units are a planning number because token counts are not
    visible to the skill.
12. **Resume from state.** `scripts/state-manager.js` records each stage; a changed brief resets later stages;
    a `failed` stage stops the run instead of looping.
13. **Stills before video.** Proof is a low-resolution contact sheet; video is one 3-second draft and
    then the final. Reason: a sheet shows composition and style in one image at a fraction of the cost.

## Scope
14. **Twelve code-drawn styles; nothing that needs a generation API.** Earlier style ideas that needed
    image or video generation (photoreal, 3D, anime-quality character art, stop-motion with real
    materials) were removed rather than faked. All shipped styles are `requires: none`.
15. **Fonts only through `@remotion/google-fonts`.** `scripts/gen-fonts.js` builds the import map and
    fails on a family the package does not ship as an ES module. A family's CSS name can differ from
    its catalogue name; the engine maps it at load (`CSS_FAMILY` in `components/engine/tokens.ts`).
16. **Voice is optional and local-first.** Captions-only is the default. Free paths are the system
    voice and Piper. Paid providers are the user's own account, key from the environment only. The
    request shapes in `scripts/voice.js` are marked [CHECK] and are not guessed beyond the documented
    endpoint, headers and body.
17. **Hyperframes is not used.** Its behaviour could not be verified from primary documentation
    during the build, so no adapter was written and nothing in the skill depends on it [CHECK].
18. **Licence allow-list, not a block-list.** `library/licences.json` names what is accepted;
    everything else is refused by `scripts/credits.js`. Trademarks are flagged for the user rather
    than auto-rejected, because a licence cannot settle them.
19. **Reversed (2026-11-14).** Kit proofs used one shared neutral specimen. That made all 12 styles
    one wireframe (see POST_MORTEM.md, F1). The specimen and its script are deleted; each style
    brings its own preview copy.
20. **AI tells are a script, not a reviewer.** The 25 rules in `references/ai-tells.md` are hardcoded
    in `scripts/check-ai-tells.js`, with `scripts/check-design.js` and `scripts/check-safezones.js`.
    A small model cannot reliably list or judge them; a script costs zero tokens and never drifts.

## Open items [CHECK]
- Claude Code skill and agent frontmatter fields were checked against summaries, not the primary spec.
- Platform safe-area and pacing numbers come from third-party creator guides.
- WCAG contrast and flash thresholds are quoted from memory of the standard; re-read before relying
  on them for accessibility claims.
- Google Fonts licences are per family; `credits.js fonts` records the family and marks it to check.
- ElevenLabs and OpenAI speech endpoints and their commercial-use terms.
- `library/costs.json` values are starting numbers; tune them from real ledgers.
