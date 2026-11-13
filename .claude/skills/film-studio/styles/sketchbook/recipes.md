# Sketchbook: panel recipes

For the Storyboard role. Each recipe is one panel in `storyboard.json`: a `layout` plus `slots`.
The kit draws it; you never describe colours, fonts or effects here.

| Recipe | layout | How to fill the slots |
|---|---|---|
| Page title | `title` | Headline 3-6 words, `emphasis` for the marker underline, kicker as a date or chapter note. |
| Doodle and note | `object` | One prop with a 2-4 word headline and a one-line sub that reads like a margin note. |
| Stick-figure moment | `figure` | One character with `says`. Poses think, shrug and slump suit the loose line best. |
| Tallied number | `stat` | A figure with a handwritten label. Keep value under 5 characters. |
| To-do list | `list` | 3-4 items under 5 words; the natural closing panel for this style. |
| Scribbled chart | `chart` | Line chart, one or two series, with `annot`. Axis labels 3 characters or fewer. |

## Rules that always apply in this style
- Minimum panel length: 1.9 s (entrance 20 frames + hold 36 frames at 30 fps).
- Anchors the style prefers: tl, bl, tr. Leave `anchor` unset unless a recipe says otherwise.
- One `energy: peak` panel per scene at most.
- Layouts not listed above still render, but they show less of the style; use them for no more than a third of panels.
