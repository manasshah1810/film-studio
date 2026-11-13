# Infographic: panel recipes

For the Storyboard role. Each recipe is one panel in `storyboard.json`: a `layout` plus `slots`.
The kit draws it; you never describe colours, fonts or effects here.

| Recipe | layout | How to fill the slots |
|---|---|---|
| Headline figure | `stat` | One number with a unit and a label of 3-6 words. The count-up takes 18 frames; hold at least 1.5 s after. |
| Two bars, one winner | `chart` | Bar chart, 2-5 bars, one series. Set `max` only if the axis must match another panel. Bars always start at zero. |
| Trend with a moment | `chart` | Line or area, at most two series plus `annot` on the turning point. Third series is drawn in ink: avoid it. |
| Side by side | `versus` | Two values with labels and units. `win: true` on one. No props unless they are pictograms of the thing counted. |
| What happened when | `timeline` | 3-4 points, `hot: true` on the one that matters. `when` is a year or date, never a sentence. |
| People as counts | `figure` | 1-2 pictogram characters with a headline that states a share ("1 in 3"). No `says`: speech bubbles are forbidden here. |

## Rules that always apply in this style
- Minimum panel length: 1.8 s (entrance 18 frames + hold 36 frames at 30 fps).
- Anchors the style prefers: tl, bl, tr. Leave `anchor` unset unless a recipe says otherwise.
- One `energy: peak` panel per scene at most.
- Layouts not listed above still render, but they show less of the style; use them for no more than a third of panels.
