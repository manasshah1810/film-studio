---
name: pixel
title: Pixel
requires: none
cost: medium
status: draft
kit: components/styles/pixel/kit.tsx
---
# Pixel

An 8-bit game screen: every shape snapped to one pixel size, four-colour sprites, a dithered sky over a tiled floor, bitmap type that types on, a dialog-window number, scanlines and a soft CRT vignette. Motion is stepped, never smooth.

- **Pick it when:** Gaming, internet culture, tech history, level-up or quest framings of a process, nostalgia.
- **Skip it when:** Sombre topics, fine data charts, long text: bitmap faces are wide and hold few words.
- Code-drawn in Remotion. No generation API, no stock art; fonts are Google Fonts loaded by id.

## Palettes
Chosen by id with `scripts/pick-design.js`; never type a hex. Roles: bg, ink, primary, secondary, highlight, shadow. Dark grounds: night-arcade, dungeon, lava-level, ice-cave, synth-sunset, terminal-green.

| id | mood | best for |
|---|---|---|
| handheld | four greens, pocket console | gaming, nostalgia, tech-history, playful |
| night-arcade | neon cabinet glow | gaming, internet, music, rivalry |
| dungeon | torchlit, treasure, danger | history, mystery, money, failure |
| overworld | blue sky, green hills, level 1 | explainer, kids, travel, startup |
| lava-level | boss fight heat | crisis, sports, energy, rivalry |
| ice-cave | cold, crystalline, calm | science, climate, space, tech |
| cartridge-grey | plastic shell, manual page | tech-history, business, how-it-works, serious |
| synth-sunset | purple dusk, pink horizon | music, culture, future, pop-culture |
| terminal-green | phosphor monitor | software, security, hacking, data |
| desert-ruins | sandstone adventure | history, travel, archaeology, food |

## Font pairings
| id | mood | display / body |
|---|---|---|
| start-screen | the classic 8x8 arcade face | Press Start 2P / Pixelify Sans |
| pocket | soft handheld menu type | Pixelify Sans / Pixelify Sans |
| terminal | tall CRT terminal glyphs | VT323 / VT323 |
| score-board | wide caps, HUD labels | Silkscreen / Pixelify Sans |
| jersey | condensed sports-game title | Jersey 10 / Jersey 15 |
| rpg-dialog | dot-matrix story text | DotGothic16 / DotGothic16 |
| tiny-hud | 5-pixel micro type, blown up | Tiny5 / Pixelify Sans |
| big-jersey | chunky 25-pixel headline | Jersey 25 / Jersey 20 |
| lcd | segmented, calculator-like | Handjet / Handjet |
| cabinet | bold marquee over mono | Bungee / Pixelify Sans |

## Motion
- 30 fps, held on 4s. Entrance 16 frames, stagger 6, minimum hold 36 frames after the last element lands.
- Easings (named, in design-system.json): step, blip, scroll, drop.
- Camera: Fixed screen. Movement happens in whole pixels on a 4-frame hold (7.5 fps): no sub-pixel drift, no rotation, no scaling. Scene changes are a hard cut or a 6-step wipe.

## Signature moves
A film in this style shows all five. Exact numbers live in `design-system.json`; the kit implements them.
1. **One pixel size for everything.** A screen pixel is 0.55 u. Sprites, floor tiles, stars, dither bands and box borders all snap to that grid; nothing is anti-aliased, rotated or scaled to a fraction.
2. **Sprites built row by row.** Every figure and prop is rasterised to a 34-column grid with a one-cell ink outline, at most four colours, and loads from the bottom row upward over 16 frames like a slow cartridge.
3. **Dithered sky, tiled floor.** Depth comes from three checkerboard dither bands above the horizon (50%, 25%, 17%) and a floor in the shadow role with an ink top row and 16 x 8 pixel tile lines at 35%. No gradients.
4. **Typed text, counted numbers.** Headlines type on one character per step with a 0.09 em hard shadow in the shadow role. The key figure counts up from zero inside a dialog window: bg fill, ink border one block thick, hard ink shadow one block down-right.
5. **CRT glass on top.** Finish with scanlines every two pixels at 10% and an ink vignette at 30% from 62% radius out. A few highlight stars blink on a 12-frame cycle. That is the only motion the background has.

## Forbidden
- Anti-aliasing, blur, glow, gradients, opacity fades on sprites
- Rotation or non-integer scaling of anything
- Smooth easing: motion is stepped on fours
- More than four colours in one sprite
- Curved vector shapes or thin lines beside the sprites
- Smooth (non-pixel) display type
- Mixed pixel sizes in one film
- Real game characters, sprites, logos or UI from existing games

## Files
- `design-system.json`: palettes, pairings, type scale, motion, textures, figure template (source of truth).
- `recipes.md`: panel recipes for the Storyboard role. `failures.md`: known failure modes and fixes.
- `rubric.md`: the 10 parameters reviewers score. Proof sheet: `node scripts/preview.js pixel [--palette id]`.
