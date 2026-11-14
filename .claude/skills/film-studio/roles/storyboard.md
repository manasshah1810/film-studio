# Storyboard

Turns the script into panels the renderer can draw: a layout, typed slots, a duration and a caption.
There is no prose shot description: if it is not in a slot, it is not on screen. Plans no effects
(that is the VFX Director). Never scores its own work.

## Inputs and output
- Reads: `work/script.json`, `work/cast.json`, `work/brief.json`, `library/platforms/<platform>.md`,
  `styles/<style>/recipes.md`, `styles/<style>/failures.md`, `rubrics/storyboard.md`. On rounds 2-3
  also `work/reviews/storyboard-r<n>-*.json`.
- Writes: `work/storyboard.json` (`schemas/storyboard.schema.json`; example in
  `schemas/example.storyboard.json`). Then `node scripts/validate-schema.js --work work`.
- Proof: `node scripts/build-film.js work` then
  `node scripts/stills.js --manifest work/render-manifest.json --all --out work/stills`.

## 1. The nine layouts
| layout | needs | use it for |
|---|---|---|
| `title` | `headline` | a statement; the hook; the close |
| `stat` | `stat` {value, unit, label} | the one number a scene turns on |
| `figure` | `cast` (1-2) | a person acting or reacting; `says` adds a speech bubble |
| `versus` | `sides` (exactly 2) | a comparison; `win: true` on one side at most |
| `chart` | `chart` {type, x, series} | a trend or ranking the script gives numbers for |
| `object` | `prop` | a thing that makes the point |
| `quote` | `quote` {text, by} | a sourced quote, or the film's key line |
| `timeline` | `points` (2-5) | what happened when; `hot: true` on the one that matters |
| `list` | `items` (2-5) | steps or parts |
Optional on any layout: `kicker`, `headline`, `sub`, `emphasis` (one word or phrase that appears in
the headline). Poses: idle, point, walk, cheer, slump, think, shrug, run, hold, fall, reach.
Expressions: neutral, happy, worried, shocked, smug, sad, angry.

## 2. Build panels scene by scene
1. Panel ids are `<scene>p<n>` (`s1p1`). Panel durations in a scene add up to the script scene exactly.
2. Start from the style's recipes: pick the recipe that fits the scene's `visual_intent`, fill its
   slots, and put its name in `recipe`. At least two thirds of panels follow a recipe.
3. One idea and one focal point per panel. Text on screen is `on_screen_text` or shorter, never the
   narration. Target 2-6 words in a headline.
4. Every panel gets `energy`: calm, build, peak or release. One `peak` per scene at most, on the
   script's turn or hook. The kits spend their loudest move on peak panels.
5. `asset_ids` lists every cast id the slots use. Only approved assets.
6. `caption`: the narration for that panel, cut to the platform's caption length. Required when the
   platform burns captions in or there is no voiceover.
7. Leave `anchor`, `accent` and `scale` unset unless a recipe or a failure note says otherwise: the
   style varies them by seed so two films do not look alike.

## 3. Pacing
- Minimum panel length is in the style's `recipes.md` (entrance plus hold). The validator rejects
  shorter panels and warns below the comfortable minimum.
- Maximum and average come from the platform file. Panel one sits inside the hook window and works as
  a still cover frame.
- Vary: never three panels of one layout in a row; follow a dense panel with a simple one.
- Length follows information: a chart needs 3 s or more, a one-word title can take 1 s.

## 4. Numbers and facts
- A number appears on screen only if the script scene has it in a fact. The validator checks this.
- `[VERIFY]` claims never go in a slot. Charts need real values from the script's facts: never draw a
  chart from a vague "it grew". Use a `timeline` or `title` instead.
- A `stat` always has a `label` saying what the number counts, and a `unit` where one exists.

## 5. Read the sheet before submitting
Check the style's `failures.md` list against the sheet, then:
- Is every panel readable at the size of a phone in a hand?
- Do the five signature moves in `style.md` each appear at least once across the film?
- Does the first panel make someone stop, and does the last one land (or loop)?
Record: `node scripts/ledger.js spend work storyboard still_render 1 --note "sheet round n"`.

## 6. Stop and report when
- A scene cannot be told with these layouts and the approved cast.
- The script's durations cannot hold readable panels at the style's minimum length.
- `build-film.js` or `stills.js` fails. Do not retry in a loop.
