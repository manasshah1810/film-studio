---
id: minimalist-doodle
status: verified
requires: none
subject_mode: layered
---
# minimalist-doodle

Hand-drawn clarity on a warm textured board. Ink lines draw on stroke by stroke, a spot marker colour fills only what
matters, and every line boils gently on twos, so the frame feels alive without moving. An expressive illustrated host
explains a hand-traced diagram. It suits psychology, self-improvement and conceptual explainers. All of it is code:
inline SVG paths, `stroke-dashoffset` draw-on, `feTurbulence` boil and grain. No images, no clip-art, no icons.
Read `design-system.json` for every number; `recipes.md` has the code, `failures.md` the traps.

## 1. When to use
- Psychology and the mind: biases, habits, anxiety loops, motivation, how memory works.
- Self-improvement: routines, focus, sleep, saying no, building one skill.
- Conceptual explainers: cause and effect, a model or framework, a before and after.
- The user asks for "doodle", "hand-drawn", "whiteboard", "sketch", "explainer drawing", "marker style".

## 2. When to avoid
- Hard data with many numbers (use `dark-neon-dataviz`) or a real map (use `tactical-vector-maps`).
- Spectacle, product launches, sci-fi or action (use `scifi-hud`, `holographic-wireframe`, `voxel-art`).
- Grief or trauma told as a story with a real person. A cartoon host can trivialise it.
- Copying a known cartoon character, a known whiteboard brand, or a real person's likeness.

## 3. The board
- A warm board, never pure white: flat `bg`, seeded fractal grain in `ink` at alpha 0.16, long horizontal fibres
  (base frequency 0.012 x 0.9) at 0.08, and a soft edge vignette of 0.07 `ink`.
- The board is static. It never boils, never pans, never zooms. The camera is locked.
- Dark palettes (`chalk-night`, `midnight-sketch`) read as a chalkboard: the same grain in light `ink` becomes dust.

## 4. Ink and spot colour
| Rule | Value | Why |
|---|---|---|
| Line colour | `ink` only | one pen, one hand |
| Outline | 7 px, round caps and joins | reads at phone size |
| Detail | 4.5 px (face, seams, hatching) | hierarchy inside the drawing |
| Markup | 10 px marker in `primary` | the eye goes there first |
| Spot fill | zigzag scribble in `primary`, 42 px wide, pitch 30, -35 degrees | a marker fill, not a flat vector fill |
| Misregistration | fill set 7 px right, 5 px down | a printed second colour |
| Streaks | 5 px lines in `mix(primary, ink, 0.2)` between scribble rows | marker grain |
| Highlighter | one 64 px swipe in `highlight` behind one label | marks the key word |
- Selective spot colour: at most 2 spot colours in a frame, `primary` and `highlight`. Everything else is `ink`
  on the board or on `surface` cards. Skin and hair are not spots; they use `skin` and `hair` (focused palettes derive
  `skin` = `surface`, `hair` = `ink`). `secondary` (expanded) is for a second character or HeadStack only.
- No gradients and no glossy shading on the drawing. Shadow, if any, is hatching in `ink` at 4.5 px.

## 5. Mode B: the layered illustrated host
- Never a stick figure, never a circle head on lines. The host is a stack of filled, outlined layers, back to front:
  back hair (a bun and a back lock), torso with sweater fill, neck, head (skin fill), ear, front hair with a swept
  fringe, brows, eyes, nose, mouth, then the pointing arm in front of the torso.
- Proportion: head 212 x 240 px, about 0.36 of the visible height; shoulders about 300 px. Framed from the waist up,
  cropped by the bottom edge, in the lower left so the diagram owns the upper and right side.
- Hair silhouette carries identity: a top bun, two flyaway strands, a fringe swept to one side. It must read as a
  shape in a thumbnail. Fill it with the `hair` scribble, no offset.
- Face: two ink oval eyes (20 x 30 px) with a `surface` catch-light, thick brows, a one-stroke nose, one mouth.
  One asymmetry: the right brow sits 9 px higher and turns -8 degrees. It reads curious.
- Pose: a bent elbow, never a straight arm. The arm is upper arm (140) and forearm (125) in nested groups, so it
  swings from the shoulder and bends at the elbow. The pointing hand has an index finger and a thumb.
- Three states, in this order the first time:
  - idle: breathing bob 4 px on twos over 48 frames; a 3 frame blink every 60 to 90 frames;
  - react: brows up 12 px, eyes 1.35 times taller, mouth an O, a 14 px hop, three surprise marks, for 14 frames;
  - act: the arm swings to point on the point spring (rest 78 and 8 degrees, point -54 and -22), the head tilts 4
    degrees toward the diagram, the eyes look along it, the mouth opens and closes every 6 frames while explaining.
- The host is drawn on like everything else: head, hair, ear, neck, sweater, arm, then brows, eyes, nose, mouth;
  fills follow their outlines. One host a scene. More people means HeadStack.

## 6. Widgets
- **SketchWords** (built). Words wipe in left to right behind a 12 percent slanted edge, 8 frames a word, 5 frames
  apart, on twos, each word with a seeded tilt of up to 1.5 degrees and 3 px of baseline drift. Used for the title,
  card labels, notes and list items. Text stays crisp; it never boils.
- **LiveMarkup** (built). On a key card: a 64 px `highlight` swipe behind the label (8 frames), then a 10 px
  `primary` marker ellipse that overshoots its start by 15 percent and spirals out 6 percent (14 frames), then a thin
  hand arrow and a short note in the accent face. One markup per beat.
- **RunningList** (built). A header in the accent face, then items that each pop a wobbly 40 px check box on the pop
  spring, draw a `primary` tick in 5 frames and wipe their words in. Items 8 frames apart. At most 4 items.
- **GreasePencilSheet**. A `surface` sheet, 76 percent wide, pinned at a 2 degree tilt, with faint `rule` lines
  every 64 px; the drawing on it shows an onion-skin ghost of the previous pose at 0.25 alpha in `rule` for 6
  frames after each pose change. Use for "before and after" and step-by-step changes.
- **HeadStack**. Two to five small heads (head only, 120 px), each with its own hair silhouette and one brow, in a
  row that pops in 4 frames apart; the speaking head gets the `secondary` collar and looks up. Use for groups,
  opinions, surveys, "most people think".

## 7. Motion
- **SVG path draw-on.** `pathLength = 1`, `stroke-dasharray: 1 1`, `stroke-dashoffset: 1 - t` on the `draw`
  easing. Duration is the stroke length over 45 px a frame, clamped to 4 to 16 frames. Strokes go in pen order, each
  starting about 2 frames before the last ends. Never all strokes at once.
- **2-frame hand-drawn boil.** `feTurbulence` (fractal noise, 0.018, 2 octaves) into `feDisplacementMap` (scale
  3.5, so at most 1.75 px) on the whole ink layer. The seed holds for 2 frames and cycles 3, 11, 23.
- **Spring pop-in.** Cards, check boxes and eyes scale 0.6 to 1 on the pop spring (10 / 190 / 0.6), sampled on
  twos; the card outline draws on while it pops.
- Pacing for 6 s: title 6 to 34, host drawn 10 to 54, cards at 46, 72, 96, arrows 58, 84, 106, the loop closes at
  118 (react), point at 128, markup 130 to 156, list 140 to 176, hold to 180.

## 8. Typography and layout
- All text is DOM, `ink` on `bg`, on a `surface` card, or on the `highlight` swipe. Never text inside the boil.
- Display 104 in a hand face, sentence case, 2 lines; body 44; accent 48 (Caveat 56); kicker 32 in `mono`.
- Margin 9 percent, left aligned title. Text stays inside x 9 to 85 and y 6 to 80. The host's face also stays above
  y 80 and left of x 85.
- Diagrams: 3 to 5 cards, 300 x 115 px, wobbly rounded outlines, linked by curved arrows with two-stroke heads.

## 9. Palettes and pairings
- Focused (5 roles: `bg`, `surface`, `ink`, `primary`, `highlight`): kraft-red, cream-teal, butter-cobalt, oat-coral,
  chalk-night.
- Expanded (adding `secondary`, `skin`, `hair`, `rule`, `shade`): sunday-journal, grain-notebook, terracotta-studio,
  sage-classroom, midnight-sketch.
- Pairings: kalam-nunito-courierprime, patrickhand-figtree-dmmono, gochi-outfit-spacemono, caveatbrush-karla-plexmono,
  architects-manrope-jetbrains, shantell-sourcesans-redhatmono.

## 10. Self-check before render
- [CHECK] The host has hair silhouette, brows, eyes and a bent-arm pose; no stick figure anywhere.
- [CHECK] At most 2 spot colours in any frame; fills sit 7, 5 px off their outlines.
- [CHECK] Lines draw on in pen order; the boil moves lines only, never text or the board.
- [CHECK] No hex in components; `check-design.js` and `check-safezones.js` pass.
