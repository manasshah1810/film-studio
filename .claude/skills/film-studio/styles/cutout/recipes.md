# Paper cutout: panel recipes

For the Storyboard role. Each recipe is one panel in `storyboard.json`: a `layout` plus `slots`.
The kit draws it; you never describe colours, fonts or effects here.

| Recipe | layout | How to fill the slots |
|---|---|---|
| Paper theatre opening | `title` | Headline 2-5 words on ink strips with one highlight `emphasis` word. The sun and hills carry the scene. |
| Puppet on stage | `figure` | One or two characters; poses cheer, point, walk. Avoid `says` on two characters at once: bubbles are paper too and crowd the stage. |
| Number on a blob | `stat` | The figure sits on a highlight paper blob. A kicker is fine: the blob stays below it. |
| Object placed | `object` | One prop dropped centre with a 3-word headline. `state: glow` adds a paper halo. |
| Two piles | `versus` | Two props with labels. Good for before and after. |
| Paper steps | `list` | 3 items. Each lands as its own piece. |

## Rules that always apply in this style
- Minimum panel length: 1.3 s (entrance 10 frames + hold 30 frames at 30 fps).
- Anchors the style prefers: tl, tr, bl. Leave `anchor` unset unless a recipe says otherwise.
- One `energy: peak` panel per scene at most.
- Layouts not listed above still render, but they show less of the style; use them for no more than a third of panels.
