# Kinetic type: panel recipes

For the Storyboard role. Each recipe is one panel in `storyboard.json`: a `layout` plus `slots`.
The kit draws it; you never describe colours, fonts or effects here.

| Recipe | layout | How to fill the slots |
|---|---|---|
| The hook | `title` | 3-5 words, one `emphasis` word in the box. No sub. This is panel one of nearly every kinetic film. |
| One word | `title` | A single word as headline, `energy: peak`. Use at most twice per film, 0.8-1.2 s each. |
| The number | `stat` | Value plus a 2-4 word label. The numeral takes the accent colour; keep `sub` empty. |
| Them and us | `versus` | Two labels, values optional, no props. Reads as two stacked statements. |
| Said out loud | `quote` | Up to 9 words. Attribute with `by`. Follow with a hard cut to a title panel. |
| Sign person | `figure` | One block silhouette, `pose` idle or point, headline 2-3 words. Use sparingly: it is the only non-type element allowed. |

## Rules that always apply in this style
- Minimum panel length: 0.8 s (entrance 7 frames + hold 18 frames at 30 fps).
- Anchors the style prefers: tl, bl, br. Leave `anchor` unset unless a recipe says otherwise.
- One `energy: peak` panel per scene at most.
- Layouts not listed above still render, but they show less of the style; use them for no more than a third of panels.
