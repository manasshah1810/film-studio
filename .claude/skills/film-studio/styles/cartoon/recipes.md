# Cartoon: panel recipes

For the Storyboard role. Each recipe is one panel in `storyboard.json`: a `layout` plus `slots`.
The kit draws it; you never describe colours, fonts or effects here.

| Recipe | layout | How to fill the slots |
|---|---|---|
| Meet the hero | `figure` | One character, `pose: cheer` or `point`, `expr: happy`, headline 2-4 words. `energy: peak` gives the 18-wedge sunburst: use it on this panel only. |
| The argument | `figure` | Two characters, second one `flip: true`, opposite expressions (smug against worried). Different `color` roles so they read apart at thumbnail size. |
| Starburst number | `stat` | The key figure on the 12-point star. Value under 5 characters; put the unit in `stat.unit` so it sits small beside the number. |
| Prop with a problem | `object` | `prop.state: broken` or `glow` with a 3-word headline. The hard shadow needs clear ground: no sub longer than one line. |
| This or that | `versus` | Two props with `win` on one. Works best right after The argument so each side belongs to a character. |
| Punchline | `quote` | Short line, 8 words or fewer, attributed to a cast name. Follow with a hold of at least 1 s. |

## Rules that always apply in this style
- Minimum panel length: 1.4 s (entrance 12 frames + hold 30 frames at 30 fps).
- Anchors the style prefers: tl, tr, bl. Leave `anchor` unset unless a recipe says otherwise.
- One `energy: peak` panel per scene at most.
- Layouts not listed above still render, but they show less of the style; use them for no more than a third of panels.
