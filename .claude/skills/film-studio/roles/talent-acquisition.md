# Talent Acquisition

Turns each need into a cast asset: a character or prop defined as data that the style kit draws.
Nothing is generated or downloaded here. Never scores its own work.

## Inputs and output
- Reads: `work/needs.json`, `work/brief.json`, the Palettes table and Forbidden list of
  `styles/<style>/style.md`, `rubrics/cast.md`. On rounds 2-3 also `work/reviews/cast-r<n>-*.json`.
- Writes: `work/cast.json` (`schema/cast.schema.json`; example in `schema/example.cast.json`).
- Proof: `node scripts/cast-sheet.js work` renders every asset on one low-resolution sheet at
  `work/stills/cast-sheet.png`. Look at it before you submit.

## 1. Characters
A character is six choices. The kit turns them into the style's own figure, so the same definition
is a rubber-hose cartoon in one style and a silhouette in another.
- `color`: a palette ROLE, never a hex: primary, secondary, highlight, shadow or ink.
- `hair`: none, short, bun, spike, cap, long.
- `build`: slim, mid, broad.
- `accessory`: none, tie, glasses, crown, scarf.
- `species`: human (default) or cat.
- `name`: a neutral label for the crew ("Lead", "Rival"). Not shown on screen.

Rules:
- The lead takes `primary`. A rival or contrast takes `secondary`. A third character takes
  `highlight` only if the style's text does not sit on highlight (check the style's contrast note).
- Any two characters must differ in at least two of colour, hair, build, accessory. The validator
  rejects identical characters; the rubric wants them told apart at thumbnail size.
- Let the definition carry the story: a crown for the market leader, a tie for the incumbent, glasses
  for the expert. One accessory each.
- Faceless styles (infographic, kinetic, noir, blueprint) ignore expression: make silhouette
  differences (build, hair, accessory) do the work.

## 2. Props
- First choice: a built-in base. `{"kind": "prop", "base": "<name>"}`. The list is in
  `roles/selector.md`. States the Storyboard can ask for: normal, broken, glow, small.
- Custom prop, only when no base fits: `vb` (view box `[width, height]`, about `[100, 100]`) and up
  to 40 `shapes`. Shape types: `rect` (x, y, w, h, r), `ellipse` (cx, cy, rx, ry), `poly` (pts),
  `line` (pts, w). `fill` and `stroke` are palette roles or `none`.
  - Build from 4-12 shapes. Big simple masses first, one detail that names the object last.
  - Use `primary` for the mass, `ink` for detail, `bg` for holes and screens, `highlight` for the one
    lit part. Do not use more than three roles in one prop.
  - No text, no logo shapes, nothing that copies a real product's design.
- Record each build: `node scripts/ledger.js spend work cast asset_build 1 --note "<id>"`.

## 3. Media (rare)
Only for a `media` need, and only after `roles/stock-sourcer.md` has recorded a licence with
`scripts/credits.js`. Without a credits entry the validator rejects the asset.

## 4. Approval
- Set `approved: false` and `round: 1` on first submission. Reviewers score the sheet with
  `rubrics/cast.md`. The Director sets `approved: true` on assets that pass.
- Unapproved assets never reach a render: `scripts/build-film.js` skips them.
- `notes`: one line on why this definition fits the need. Reviewers read it.

## 5. Check the sheet yourself first
- Can you tell every character apart with your eyes half closed?
- Does each prop read as its object without a label?
- Does anything break the style's Forbidden list? (The kit prevents most of it; custom shapes can
  still be too detailed or too thin.)
Record the proof: `node scripts/ledger.js spend work cast still_render 1 --note "cast sheet"`.

## 6. Stop and report when
- A need cannot be met by a character definition, a built-in base or 40 shapes.
- A need describes a real logo, person or existing character.
- `cast-sheet.js` fails. Do not retry in a loop.
