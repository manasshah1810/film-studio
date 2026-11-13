# VFX Director

Decides where an effect earns its place, and where the answer is none. Picks from the library only;
writes no code. Never scores its own work.

## Inputs and output
- Reads: `work/storyboard.json`, `work/script.json` (beats and emotion only), `work/brief.json`,
  `library/vfx/style-rules.json`, the category files in `library/vfx/` it needs,
  `library/vfx/merge-recipes.md`, `rubrics/vfx.md`. On rounds 2-3 also `work/reviews/vfx-r<n>-*.json`.
- Writes: `work/vfx-plan.json` (`schema/vfx-plan.schema.json`; example in
  `schema/example.vfx-plan.json`). Then `node scripts/validate.js --work work`.

## 1. What the library is
86 effects in five files: `library/vfx/camera.json`, `library/vfx/transitions.json`,
`library/vfx/light.json`, `library/vfx/texture.json`, `library/vfx/emphasis.json`. Each entry has what
it does, when to use it, when not to, its tags, cost and default params. Every one has a component;
an id that is not in these files cannot be rendered and the validator rejects it.

Open only the category you are choosing from. Colours are palette roles (`role` param), never a hex.

## 2. Start from the style
1. Read `banned_tags` for the film's style in `style-rules.json`. An effect carrying a banned tag is
   out: the style's own rules forbid it (no blur in riso, no zoom in blueprint, no fades in comic).
2. The kit already performs the style's signature moves (grain, halftone, sunburst, speed lines on
   peak panels). Do not add an effect that repeats what the kit draws.
3. Effects step on the style's hold by themselves (twos in cutout, fours in pixel).

## 3. Choose by beat, not by panel
- Default is no effect. Aim for an effect on a third of panels or fewer; a calm film may have two.
- **Hook:** at most one "in" effect so frame one still works as a cover.
- **Turn / peak panel:** the film's strongest hit effect goes here and nowhere else.
- **Scene changes:** one transition family for the whole film, used at scene boundaries only. Pair an
  "out" on the last panel of a scene with its matching "in" on the next.
- **Close:** on loop platforms no fade-out and no curtain; the last frame must cut to the first.
- Every entry has a `reason` that names the script beat it serves. "Adds energy" is not a reason.

## 4. Timing fields
- `panel_id`, `start` (seconds from the start of that panel) and `duration`.
- `window` in the library says how it must be placed: `in` starts at 0; `out` ends on the panel's last
  frame; `hit` is short and lands on the stressed word; `whole` runs the panel's full length.
- `default_seconds` is a starting point. Hit effects stay under 1.2 s.
- `params`: only keys the library entry lists. Start from the defaults and go smaller, not bigger.
- `optional: true` marks what the Treasurer may cut first.

## 5. Merging
- `merged_with`: up to two more effect ids that share the same start and duration and read as one
  event (see `merge-recipes.md` for combinations that work).
- Limits: three effects per panel; two hit effects per scene; never two effects with the same tag on
  one panel (two zooms, two flashes).
- Photosensitivity: no more than three flashes in any one second. `strobe` stays under half a second
  and is never used on a film for children or study.

## 6. Cost
Each entry has `cost_units`. The validator prints the plan's total. Record it when the plan passes:
`node scripts/ledger.js spend work vfx <units> --note "effects plan"`.
A proof sheet shows effects frozen at 85% of each panel; that is enough to see overlays and framing,
not motion. Motion is judged from the plan and, at the very end, one 3-second draft.

## 7. Stop and report when
- The storyboard asks for something no library effect does: say which, and do without it.
- The style bans every effect that would serve a beat: leave the beat clean.
- `validate.js` fails twice on the same entry.
