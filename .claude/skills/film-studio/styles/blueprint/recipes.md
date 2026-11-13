# Blueprint: panel recipes

For the Storyboard role. Each recipe is one panel in `storyboard.json`: a `layout` plus `slots`.
The kit draws it; you never describe colours, fonts or effects here.

| Recipe | layout | How to fill the slots |
|---|---|---|
| Drawing title | `title` | Headline 2-5 words, upper case in most pairings, with a slash kicker such as a part or section name. |
| Elevation | `object` | One prop, hatched, with the dimension line under it. Headline names the part. |
| Operator | `figure` | One line figure with a `says` callout in a square mono box. Pose point or hold. |
| Spec callout | `stat` | The figure counts up inside four corner ticks. Always give a unit. |
| Tolerance chart | `chart` | Line or bar with grid lines; `annot` becomes a flag callout. |
| Assembly steps | `list` | 3-4 numbered steps, each under 5 words. |

## Rules that always apply in this style
- Minimum panel length: 1.9 s (entrance 20 frames + hold 36 frames at 30 fps).
- Anchors the style prefers: tl, bl. Leave `anchor` unset unless a recipe says otherwise.
- One `energy: peak` panel per scene at most.
- Layouts not listed above still render, but they show less of the style; use them for no more than a third of panels.
