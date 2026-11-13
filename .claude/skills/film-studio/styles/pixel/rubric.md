# Pixel: style rubric

Scored by the reviewers on proof stills and `film.json`, never by the author. Score each parameter 1-10.
Pass: average 9.0 or more from both reviewers and no parameter under 7 (see `rubrics/review-protocol.md`).

| # | Parameter | 9-10 looks like | 6 or below when |
|---|---|---|---|
| 1 | Single pixel grid | Every edge in the frame lands on the same pixel size. | Mixed pixel sizes or sub-pixel edges. |
| 2 | No anti-aliasing | Hard pixel edges; no blur, glow or gradient. | Any smooth edge or soft effect on sprites. |
| 3 | Sprite colour limit | Four colours or fewer per sprite with a one-pixel ink outline. | Extra shades or missing outline. |
| 4 | Dither and tile depth | Sky uses dither bands; floor is tiled with an ink top row. | Flat background or a gradient. |
| 5 | Bitmap type | All display text in a pixel face with hard shadow. | Smooth fonts. |
| 6 | Stepped motion | Movement on a 4-frame hold in whole pixels. | Smooth easing, rotation or scaling. |
| 7 | Dialog window | Key number or speech sits in a bordered window. | Floating number. |
| 8 | CRT finish | Scanlines and vignette present but under 30% and never hurting legibility. | Missing, or heavy enough to dim text. |
| 9 | Screen economy | Few words; sprite and text do not overlap. | Crowded screen or clipped text. |
| 10 | Originality | No sprite, logo or UI from an existing game. | Recognisable borrowed asset. |

Evidence: name the panel id for every score under 9. A score with no panel id is void.
