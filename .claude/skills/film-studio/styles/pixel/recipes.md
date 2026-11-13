# Pixel: panel recipes

For the Storyboard role. Each recipe is one panel in `storyboard.json`: a `layout` plus `slots`.
The kit draws it; you never describe colours, fonts or effects here.

| Recipe | layout | How to fill the slots |
|---|---|---|
| Title screen | `title` | Headline of 2-4 short words. Bitmap type is very wide: over 16 characters will shrink below comfort. |
| Player enters | `figure` | One sprite, `pose: idle` or `cheer`, `says` 3 words or fewer in a dialog box. |
| Score window | `stat` | The figure counts up inside the dialog window. Label 2-4 words. |
| Player one, player two | `versus` | Two cast or props with values. `win` marks the winner. |
| Item get | `object` | One prop with `state: glow` and a 2-3 word headline. |
| Quest log | `list` | 3 items, 3 words each. Ends a film well. |

## Rules that always apply in this style
- Minimum panel length: 1.7 s (entrance 16 frames + hold 36 frames at 30 fps).
- Anchors the style prefers: tl, bl, tr. Leave `anchor` unset unless a recipe says otherwise.
- One `energy: peak` panel per scene at most.
- Layouts not listed above still render, but they show less of the style; use them for no more than a third of panels.
