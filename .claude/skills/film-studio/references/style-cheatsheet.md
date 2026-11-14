# Style cheatsheet

The only file to read for the Director's style question. Twelve styles, all made for 9:16 Reels and
Shorts, all drawn in code. Do not open a style folder to choose; open one only after the user picks.

| Style id | Look in one line | Best for | Subject mode |
|---|---|---|---|
| `hormozi-kinetic` | Huge bold captions that pop word by word, one highlight colour on the key word, icon and emoji punches | Business, money, sales, productivity, blunt advice | ui-first |
| `neo-brutalist-ui` | Thick black outlines, hard offset shadows, flat loud colour blocks, raw app windows and buttons | Apps, startups, product explainers, tech opinions, tool comparisons | ui-first |
| `dark-neon-dataviz` | Near-black canvas where glowing charts, counters and tickers draw themselves on | Finance, markets, statistics, science results, trends | ui-first |
| `tactical-vector-maps` | Flat vector maps with route lines, pins and unit markers while the camera pans across terrain | History, geopolitics, war, travel, trade routes, logistics | ui-first |
| `2-5d-parallax-depth` | Cut-out illustrated layers on separate depth planes with a slow camera dolly between them | Stories, biographies, case studies, emotional topics | layered |
| `scifi-hud` | Thin-line heads-up display: reticles, scanning readouts and callouts in cyan and amber on dark | AI, space, cybersecurity, future tech, cars and gadgets | ui-first |
| `archival-grunge` | Scanned paper, halftone photo cut-outs, torn edges, stamps, typewriter labels, grain and frame jitter | True crime, mysteries, old scandals, documentaries, conspiracies | layered |
| `low-poly-isometric` | Faceted 3D dioramas seen from an isometric angle; objects assemble piece by piece with soft shadows | How things work, systems, cities, economics, supply chains | layered |
| `holographic-wireframe` | Glowing wireframe 3D objects turning over a dark grid with scanlines and exploded parts | Engineering, anatomy, hardware teardowns, architecture | layered |
| `glowing-plexus` | Drifting networks of bright nodes and links that pulse, cluster and rewire | Networks, AI models, neuroscience, the internet, abstract ideas | ui-first |
| `voxel-art` | Chunky worlds and characters built from cubes, snapping into place block by block | Gaming, pop culture, crypto, kids, simple explainers | layered |
| `minimalist-doodle` | Clean hand-drawn characters with faces and hands on off-white, one accent colour, a light line wobble | Psychology, self-help, relationships, philosophy, everyday life | layered |

## How to choose three to offer
1. Match the topic to "Best for". Take the two closest rows.
2. Add one contrast pick: if both are ui-first, add the closest layered style, and the reverse.
3. Offer the three by id with their one-line look, plus "describe your own" (then map the
   description to the closest row and say which one you chose).
4. A style can be offered only if it is built: `node scripts/check-design.js --systems <id>` prints
   PASS. If a pick is not built, take the next closest row. If none is built, stop and tell the user.

## Subject mode
- **ui-first:** no characters. Type, widgets, charts and maps carry the story.
- **layered:** subjects are built from at least 4 named layers with depth. Never circle-and-line figures.

After the user picks, the brief stores the id in `style`; from then on read only
`styles/<id>/style.md`, and only in the stages that list it in SKILL.md.
