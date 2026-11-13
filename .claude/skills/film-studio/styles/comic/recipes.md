# Comic: panel recipes

For the Storyboard role. Each recipe is one panel in `storyboard.json`: a `layout` plus `slots`.
The kit draws it; you never describe colours, fonts or effects here.

| Recipe | layout | How to fill the slots |
|---|---|---|
| Splash page | `title` | Headline 2-5 words in the caption box, `energy: peak` for speed lines. Only one peak panel per scene: the lines must mean something. |
| Balloon exchange | `figure` | Two characters, each with `says` of 4 words or fewer, upper case is applied by the kit. One `flip: true` so they face each other. |
| Impact number | `stat` | The key figure with the 26-stroke burst. Use an accent role, not ink: the outlined italic needs a colour to outline. |
| The showdown | `versus` | Two sides with props or cast, `win: true` on one. Put it at the turn of the story. |
| Meanwhile | `timeline` | 3 points; reads as narration boxes down the panel. `hot` marks the blow. |
| Last panel | `quote` | A closing line under 10 words; no `energy: peak` here so the page ends quiet. |

## Rules that always apply in this style
- Minimum panel length: 1.2 s (entrance 6 frames + hold 30 frames at 30 fps).
- Anchors the style prefers: tl, bl, tr. Leave `anchor` unset unless a recipe says otherwise.
- One `energy: peak` panel per scene at most.
- Layouts not listed above still render, but they show less of the style; use them for no more than a third of panels.
