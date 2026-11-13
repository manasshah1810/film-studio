---
name: blueprint
title: Blueprint
requires: none
cost: low
status: draft
kit: components/styles/blueprint/kit.tsx
---
# Blueprint

A drawing sheet: fine and coarse grid, ruled border, title block with a sheet number, constant-width white line, 45-degree hatching for mass, dimension lines with arrowheads, mono labels and corner ticks round the key figure. Plotted, not painted.

- **Pick it when:** How-it-works, engineering, architecture, product teardowns, process and systems explainers, invention history.
- **Skip it when:** Emotional stories, comedy, lifestyle.
- Code-drawn in Remotion. No generation API, no stock art; fonts are Google Fonts loaded by id.

## Palettes
Chosen by id with `scripts/pick-design.js`; never type a hex. Roles: bg, ink, primary, secondary, highlight, shadow. Dark grounds: cyanotype, blackline, green-board, night-shift, slate.

| id | mood | best for |
|---|---|---|
| cyanotype | classic white on blue | how-it-works, engineering, architecture, invention |
| drafting-vellum | ink on cream tracing paper | history, design, patents, education |
| blackline | CAD screen, dark and exact | tech, software, hardware, data |
| diazo-violet | whiteprint, purple line | science, process, policy, planning |
| green-board | circuit board, surveyor | electronics, energy, climate, maths |
| sepia-print | aged Van Dyke print | history, railways, ships, biography |
| night-shift | control room, cyan trace | space, aviation, security, future |
| graphite | pencil on white, studio | product, startup, design, serious |
| slate | workshop chalk on slate | craft, construction, tools, business |
| terracotta-plan | brick-red site plan | architecture, cities, travel, culture |

## Font pairings
| id | mood | display / body |
|---|---|---|
| title-block | condensed engineering capitals | Barlow Condensed / Barlow |
| draughtsman | hand-lettered drawing notes | Architects Daughter / Architects Daughter |
| terminal | all-mono spec sheet | Space Mono / IBM Plex Mono |
| aerospace | squared technical sans | Rajdhani / Rajdhani |
| schematic | octagonal sci-fi labelling | Oxanium / Exo 2 |
| din-plate | road-sign neutral, exact | Chakra Petch / IBM Plex Sans |
| patent-office | engraved serif with mono notes | Old Standard TT / Old Standard TT |
| workshop | stencil crate marking | Black Ops One / Saira |
| grid-system | Swiss grotesk, tight | Archivo / Archivo |
| survey | map lettering, wide tracking | Jura / Jura |

## Motion
- 30 fps, held on ones. Entrance 20 frames, stagger 5, minimum hold 36 frames after the last element lands.
- Easings (named, in design-system.json): plot, rule, snap, settle.
- Camera: Orthographic and locked: no perspective, no rotation, no zoom. Lines are plotted at constant speed like a pen plotter; text types on; numbers count up. Scene changes are a horizontal wipe along a grid line.

## Signature moves
A film in this style shows all five. Exact numbers live in `design-system.json`; the kit implements them.
1. **Sheet, grid and title block.** Every frame is a drawing sheet: a 2.5 u grid at 12% with every fourth line at 30%, a 0.22 u ink border inset 3 u, and a mono title block in the bottom-right corner reading "SHEET nn | NTS" where nn is the scene number.
2. **Line and hatch, never fill.** Objects are a constant 1.6-unit butt-capped outline. Mass is shown only with 45-degree hatching (gap 3.2, width 0.7); no shape is ever filled solid. Lines are plotted on stroke by stroke over 20 frames.
3. **Dimension line under the subject.** A secondary-colour dimension line spans 72% of the visual zone 1.2 u beneath it: extension ticks 2.8 u tall and open arrowheads at both ends, drawn left to right after the object is complete.
4. **Callout ticks on the key figure.** The key number counts up from zero and is framed by four L-shaped corner ticks 3 u long, set 1.6 u off its bounding box, each growing from its corner. No box, no circle.
5. **Everything labelled in mono.** Kickers open with a slash and are set in the mono face at 3.1 u; attributions are prefixed "REF: "; chart labels and bubbles are mono with square corners. Emphasis is an underline, not a colour block.

## Forbidden
- Solid filled shapes: mass is hatched
- Perspective, 3D rotation or camera zoom
- Rounded corners, round line caps and soft shadows
- Bounces and overshoots: plotters do not bounce
- Line widths that vary within one drawing
- Type or objects placed off the grid or across the border
- Gradients and glows
- Real company title blocks, part numbers or patent drawings

## Files
- `design-system.json`: palettes, pairings, type scale, motion, textures, figure template (source of truth).
- `recipes.md`: panel recipes for the Storyboard role. `failures.md`: known failure modes and fixes.
- `rubric.md`: the 10 parameters reviewers score. Proof sheet: `node scripts/preview.js blueprint [--palette id]`.
