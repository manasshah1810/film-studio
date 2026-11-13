# Watercolour: panel recipes

For the Storyboard role. Each recipe is one panel in `storyboard.json`: a `layout` plus `slots`.
The kit draws it; you never describe colours, fonts or effects here.

| Recipe | layout | How to fill the slots |
|---|---|---|
| Opening wash | `title` | Headline 3-6 words with one `emphasis` word; sub of one line. Give it 3 s: washes bloom for 22 frames before the type settles. |
| Portrait | `figure` | One character, poses think, idle, reach. A short `says` works; two bubbles do not. |
| Number in a puddle | `stat` | One figure per film in the highlight puddle; label 3-6 words in the body serif. |
| Still life | `object` | One prop with a 2-4 word headline. The ground pool keeps it from floating. |
| A line to keep | `quote` | Up to 14 words. The best layout for this style; use it at the turn or the close. |
| Seasons | `timeline` | 3 points with one `hot`. Use for change over time instead of a chart. |

## Rules that always apply in this style
- Minimum panel length: 2.2 s (entrance 22 frames + hold 45 frames at 30 fps).
- Anchors the style prefers: tl, tr, bl. Leave `anchor` unset unless a recipe says otherwise.
- One `energy: peak` panel per scene at most.
- Layouts not listed above still render, but they show less of the style; use them for no more than a third of panels.
