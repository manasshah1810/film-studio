# Noir: panel recipes

For the Storyboard role. Each recipe is one panel in `storyboard.json`: a `layout` plus `slots`.
The kit draws it; you never describe colours, fonts or effects here.

| Recipe | layout | How to fill the slots |
|---|---|---|
| Case opens | `title` | Headline 3-6 words typed on, one `emphasis` word in the accent colour. That word is the panel's single accent. |
| The suspect | `figure` | One silhouette, pose idle, think or slump. No `expr` matters: there is no face. Accessory tie or scarf carries the accent. |
| Two in a room | `figure` | Two silhouettes facing each other, one flipped. Only one may carry an accent accessory. |
| The figure that sank them | `stat` | Key number in the accent with the ink underline; label typed below. |
| Exhibit A | `object` | One prop; `state: glow` lets the highlight role act as the light. Kicker as a file label. |
| Timeline of the night | `timeline` | 3-4 points, `hot` on the turn. `when` as dates or times. |

## Rules that always apply in this style
- Minimum panel length: 2.4 s (entrance 18 frames + hold 40 frames at 24 fps).
- Anchors the style prefers: bl, tl, tr. Leave `anchor` unset unless a recipe says otherwise.
- One `energy: peak` panel per scene at most.
- Layouts not listed above still render, but they show less of the style; use them for no more than a third of panels.
