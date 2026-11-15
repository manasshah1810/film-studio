---
id: dark-neon-dataviz
status: verified
requires: none
subject_mode: ui-first
---
# dark-neon-dataviz

An obsidian screen with a glowing neon line on it. The chart is the subject and the number is the
hero. It is the look of a market terminal that shows you the moment something falls. Mode C, data
first: there are no people in this style. Read `design-system.json` for every number; this file says
how to use them. `recipes.md` has the code, `failures.md` the traps.

## 1. When to use
- Market share, revenue, stock, price, user count: any story where one number moves a lot.
- Business downfall, collapse, recession, layoffs, "how it fell apart" explainers.
- Statistical and financial stories where a curve or a counter is the proof.
- The tone is cold, exact and a little ominous. The viewer should feel the drop.
- The user asks for "dark mode chart", "neon", "terminal", "fintech", "dataviz", "market crash".

## 2. When to avoid
- Warm, human or emotional stories that need faces or places (use a photo or illustration style).
- Playful or product-demo films (use `neo-brutalist-ui`).
- Data with no real numbers. A neon chart of invented data looks like proof; it is not.
- A long run of glow with no relief. Past 45 s, lift the atmosphere layer and change the hero card at each re-hook (every 12 to 15 s); length itself is no limit.

## 3. Mode C rules: UI and data first
- The subject is the chart, the counter and the cards. Strictly zero human stick figures:
  no silhouettes, no avatars, no faces, no Narrator bust. A person is never drawn here.
- Money is shown as a banknote glyph, a coin stack or a number, never as a person holding it.
- Every film has one line chart or one counter that carries the story. Cards support it.
- Numbers come from the script. If a figure is not sourced, mark it `[VERIFY]` or say
  "illustrative data" on screen, as the specimen does.

## 4. Obsidian luminance tiers
Every colour has one job. A higher tier is brighter and sits above a lower one.
| Tier | Name | Value | Use |
|---|---|---|---|
| 0 | ground | `bg` #070B14 | the whole frame |
| 1 | card | `surface` #0F172A | chart card, label plates, stat cards |
| 2 | grid | `ink` at 12 percent | grid lines, axis lines, ground stripes; never text |
| 3 | label | `muted` | axis labels and captions on a card, 4.5:1 on `surface` |
| 4 | text | `ink` | titles, numerals, callout labels |
| 5 | neon | `primary`, `highlight`, `alert` | one data line and one callout colour |
- All 10 palettes keep tier 0 and tier 1 identical, so only the neon and the ink change.
- Every neon and every text colour is 4.5:1 or better on both `bg` and `surface` (the table in
  BUILD_LOG lists the lowest value per palette). Dark red and muted purple are never used for labels.
- No pure black. #070B14 keeps a blue edge so the glow has something to sit on.

## 5. Palettes
10 palettes, two tiers. Pick by topic, then check the callout colour reads as danger or as growth.
| Tier | Colours | Palettes | Use it when |
|---|---|---|---|
| Focused | 5 | obsidian-cyan, ember-drop, gold-ledger, mint-ticker, violet-signal | one chart, one message |
| Expanded | 10 | market-open, bear-market, fintech-aurora, crypto-sunset, boardroom-ice | several series or cards |
- Roles: `bg`, `surface`, `ink`, `primary` (the data line), `highlight` (the callout colour). Expanded
  adds `secondary`, `tertiary`, `alert`, `positive`, `muted`.
- A fall uses `alert` (or `highlight` in a focused palette). A rise uses `positive` or `primary`.
- At most 2 neon colours in one chart. Colour is a role name, never a hex.

## 6. Typography and tabular numerals
Sizes are pixels on the 1080 x 1920 frame. Display is at least 2.2x the body.
| Level | Size | Notes |
|---|---|---|
| Numeral | 200 | the odometer; fixed width digit columns |
| Display | 108 | the title |
| Stat number | 84 | a number on a stat card |
| Body | 44 | a callout value |
| Label | 34 | mono; axis labels and plate labels; the floor for any text |
- 6 SIL OFL pairings, all Google Fonts: grotesk-inter-jb, plex-ledger, sora-manrope-dm,
  oxanium-barlow-martian, rajdhani-saira-roboto, chakra-inter-redhat.
- Every number is tabular: `font-variant-numeric: tabular-nums`. A counting number sits in fixed
  width columns (0.62 em each), so the layout never shifts as digits change.
- Titles in sentence case, axis and plate labels in upper case mono. The unit (%) is its own element.
- Text lives in x 8 to 85 percent and y 8 to 80 percent.

## 7. Glow and legibility
Glow is the one effect. It is controlled so it never costs a label.
- One SVG filter: `feGaussianBlur` 5 (inner) and 14 (outer), the outer at 0.7 alpha, merged under
  the source. The outer radius never exceeds 28 px.
- The filter region is the card only (`userSpaceOnUse`), so glow cannot leave the card or reach text.
- Glow goes on the data line, the head dot and the nodes. Never on text, plates, grid or labels.
- Every callout label sits on an opaque `surface` plate with an `alert` border. Plates are drawn
  above the glow. Text never sits on a stripe or a glow.
- Rack focus dims lines and nodes, never label text.

## 8. Top widgets
| Widget | Use it when | Spec |
|---|---|---|
| CloneRow | a share of a whole: 3 of 10 | a row of identical flat bars or coins; the lost ones dim to tier 2, the rest stay neon |
| OrbitRing | one number with parts around it | a ring of 4 to 8 nodes on an orbit around a central odometer, rotating 0.4 degrees a frame |
| Banknote | money gained or lost | a flat vector note or coin stack, no figures; a stack shrinks or splits as the number falls |
| GridCollapse | a base that shrinks | a 8 x 5 tile grid; tiles drop out in a stagger as the share falls; one grid per film |
| RackFocus | a chart with 2 or more callouts | all but the active callout dim, then the focus moves to the next node |
One widget family per card. Widget text comes only from the script.

## 9. Top motions
| Motion | Where | Spec |
|---|---|---|
| SVG path draw-on | the data line | `strokeDasharray` equal to the real path length, offset 1 to 0 over 80 frames, `draw` bezier |
| Odometer roll | every counting number | digit columns 0 to 9, each rolls on the second half of its step, a leading zero fades |
| Continuous camera drift | the whole scene | scale 1.00 to 1.03 and a 14 px pan for the whole film, `drift` bezier, never stops |
| Node pop | callouts | `pop` spring damping 11, stiffness 190, a ring pulse, then a leader draws to its plate |
Limits per 35 s: 6 odometers, 4 callouts per chart, 1 chart on screen at a time. The area
gradient grows with the line, clipped to the line head, from 38 percent alpha to 0.

## 10. Anti-patterns
- A person of any kind: stick figure, silhouette, avatar, hand holding a coin.
- Labels in dark red, muted purple or grey under 4.5:1 on their card.
- Text over stripes or over a glow. Put it on a plate.
- Glow on text, glow wider than 28 px, a glow that leaves the card.
- Proportional digits in a counter, or a counter that shifts its neighbours.
- A neon rainbow. One line colour, one callout colour.
- Default CSS ease or linear. Name a bezier or a spring.
- Invented numbers shown as real.

## 11. Proof
- Specimen: `components/styles/dark-neon-dataviz/Preview.tsx`, rendered in `obsidian-cyan` and
  `bear-market`; stills in `previews/dark-neon-dataviz/`.
- Gate: `node scripts/check-design.js --systems dark-neon-dataviz`, then `check-design.js` and
  `check-safezones.js` on the film's work folder.
