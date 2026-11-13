# Risograph: panel recipes

For the Storyboard role. Each recipe is one panel in `storyboard.json`: a `layout` plus `slots`.
The kit draws it; you never describe colours, fonts or effects here.

| Recipe | layout | How to fill the slots |
|---|---|---|
| Cover | `title` | Headline 2-5 words, one `emphasis` word in the primary. The overprinted plates sit in a corner: let the anchor default. |
| Sun number | `stat` | The figure rises over a highlight circle. Use primary for the value. |
| Poster person | `figure` | One or two flat characters in different spot colours; short `says` in a highlight bubble. |
| Object plate | `object` | One prop, `state: glow` optional, 3-word headline. |
| Flyer list | `list` | 3 items; numbers print in the primary with a ghost. |
| Either/or | `versus` | Two props or values. `win` takes the primary. |

## Rules that always apply in this style
- Minimum panel length: 1.4 s (entrance 12 frames + hold 30 frames at 30 fps).
- Anchors the style prefers: tl, bl, tr. Leave `anchor` unset unless a recipe says otherwise.
- One `energy: peak` panel per scene at most.
- Layouts not listed above still render, but they show less of the style; use them for no more than a third of panels.
