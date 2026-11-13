# Whiteboard: panel recipes

For the Storyboard role. Each recipe is one panel in `storyboard.json`: a `layout` plus `slots`.
The kit draws it; you never describe colours, fonts or effects here.

| Recipe | layout | How to fill the slots |
|---|---|---|
| Write the claim | `title` | headline 3-6 words, one `emphasis` word for the highlighter swipe, `anchor: tl`. No sub: the board starts nearly empty. |
| Circle the number | `stat` | Use once per film on the single figure the script turns on. `stat.label` under 6 words. The two-loop circle only draws on this layout. |
| Teacher points | `figure` | One character, `pose: point`, `says` under 4 words. The because-arrow joins the bubble to the headline, so keep the headline on the opposite side (`anchor` tl with the figure right). |
| Before and after | `versus` | Two props or two values, `win: true` on one side only. Labels are single words; the board cannot hold two sentences side by side. |
| Draw the curve | `chart` | Line chart with at most 2 series and one `annot`. The line is written left to right; put the annotation at the point the voiceover names. |
| Steps on the board | `list` | 3 items, each under 5 words, numbered by the kit. Follow it with a title or quote panel so the ghost layer has something to keep. |

## Rules that always apply in this style
- Minimum panel length: 1.7 s (entrance 26 frames + hold 24 frames at 30 fps).
- Anchors the style prefers: tl, bl, tr. Leave `anchor` unset unless a recipe says otherwise.
- One `energy: peak` panel per scene at most.
- Layouts not listed above still render, but they show less of the style; use them for no more than a third of panels.
