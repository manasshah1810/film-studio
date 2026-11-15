# The 28 AI tells

These are the exact things that make a short video read as machine-made. They are not for you to
judge. A script checks all 28 and prints PASS or FAIL with the fix:

```
node scripts/check-ai-tells.js work --stage script       # rules 1 2 11 12 14 24 28
node scripts/check-ai-tells.js work --stage storyboard   # those + 5 6 7 8 10 13 15 16 17 18 19 20 25 26 27
node scripts/check-ai-tells.js work                      # all 28 (a missing input is a FAIL)
```

Read this file only to learn what a FAIL line means. Do not score by eye. Fix every FAIL, run again.
The numbers below are the same constants as in `scripts/check-ai-tells.js`; change both or neither.

## Words (from `work/script.json`)

| # | Rule | FAIL | PASS |
|---|---|---|---|
| 1 | **No Why / How / What-is opener.** The first narration sentence, first on-screen text, first headline and first caption may not start with Why, How, What is, What's or What are. | "Why small habits win" | "You do not need more discipline." |
| 2 | **No AI buzzwords.** Banned anywhere on screen or spoken: delve, tapestry, testament, game-changer, unlock the secrets, fast-paced world, ever wondered. | "In today's fast-paced world, habits are a game-changer." | "Big plans collapse on day three." |
| 11 | **Sentence cadence varies.** Words per sentence: standard deviation of at least 2, and never three sentences in a row within 1 word of each other. | 5, 5, 5, 5, 5 words | 6, 13, 14, 10, 6, 2 words |
| 12 | **Causal connectors over listicles.** At least max(2, sentences / 4) of: because, so, but, therefore, which means, that's why, until, unless, instead, yet, except, turns out, as a result, then. List markers (first, second, next, also, another, finally, step 1...) may not outnumber them. | "First, pick a cue. Second, make it tiny. Also, repeat it." | "Most people set a huge goal, so one missed day feels like failure. But two minutes survives a bad day." |
| 14 | **Zero placeholder strings.** specimen, placeholder, lorem and 42% never appear; a stat of value 42 with unit % is rejected. | "Placeholder quote", stat 42 % | The real line; the sourced number |
| 28 | **Single-angle / shallow script.** `work/angles.json` exists with 6 to 8 scored angles and 3 or 4 selected; every scene but the close names a selected `angle`, and every winner is used. Headlines (`on_screen_text`) are 2 to 4 power words, no caption repeats its headline, and the film never opens on a pronoun. | no `angles.json`; headline "The story of a coin"; caption = headline; first caption "She sold it" | 7 angles, a1 a3 a4 a5 selected; "ZERO BLOCKCHAIN" over "So every coin was" |
| 24 | **[VERIFY] on unsourced claims.** A fact with an empty source has status VERIFY. A sentence with a digit sits in a scene that has a fact entry. No number goes on screen while its fact is VERIFY. | "80% of people quit." with `facts: []` | Same line with `{"claim": "...", "status": "VERIFY", "source": ""}` and the number kept off screen |

## Picture (from `work/storyboard.json`, `work/cast.json`, the design system)

| # | Rule | FAIL | PASS |
|---|---|---|---|
| 5 | **Centre-only layouts at most 40%.** A panel is centre-only when every text box has its centre x between 45 and 55 (no boxes: anchor missing or `c`). | 4 of 4 panels at x 10, w 80 | 2 of 6 centred; the rest at x 8, w 70 |
| 6 | **No adjacent duplicate layout ids.** Two panels in a row never share `layout`. | title, title, title | title, object, stat, versus |
| 7 | **No default purple-blue gradient.** Any gradient whose colours run from a vivid blue (hue 200-255) to a vivid purple (hue 255-300), or a known default pair such as #667eea to #764ba2. | `"gradient": ["#667eea", "#764ba2"]` | A flat palette colour, or two shades of one hue |
| 8 | **No stick figures.** The design system says `subject_mode` `layered` or `ui-first`. A character has at least 4 named layers and is not built only from ellipse and line shapes. A ui-first film has no character at all. | head: ellipse; body, arms, legs: line | head, torso, arms, legs, shadow as poly / rect layers; or no character and three widgets |
| 10 | **Max 5 words per caption chunk.** Each entry of `captions` (or the single `caption`). | "this caption chunk has far too many words in it" | `["You need a smaller plan", "because big plans collapse"]` |
| 13 | **Widgets and cards are anchored.** `anchor` is a frame edge (tl t tr l r bl b br) or `@<box id>` of a box in the same panel. Centre or missing means it floats. | `{"id": "toast"}` | `{"id": "toast", "anchor": "tr"}` or `"anchor": "@h"` |
| 15 | **Zero text box overlaps.** Two text boxes on screen at the same time never intersect. | headline y 62-86 over body y 70-80 | headline y 18-42, body y 46-58, caption y 68-76 |
| 16 | **WCAG AA contrast.** Display text at least 3.0:1, all other text at least 4.5:1, for every text box and for every text role on every surface role of the palette. | #333333 on #0B0D10 = 1.54:1 | #F4F6F8 on #0B0D10 |
| 17 | **9:16 safe zones.** Text, captions and faces stay out of the bottom 20% and the right 15%: y + h at most 80, x + w at most 85. Every panel has boxes; captions have a caption box. | box x 10, w 80 (ends 90); y 62, h 24 (ends 86) | box x 8, w 70; caption y 68, h 8 |
| 18 | **At least 1 micro-widget or bespoke scene per 2 scenes.** No two scenes in a row are both without one. | scenes s1 and s2 with no `widgets` or `bespoke` | a widget or bespoke scene in s1, s2 and s3 |
| 26 | **Forced-widget mismatch.** A widget whose `library/widgets.json` entry has a `domain` (filmmaking, software, social-media UI) is used only when `brief.domains` lists it (else the topic must name it). | `nle-timeline` or `lens-ring` on a finance story | a bespoke ledger scene; `orbit-ring` |
| 27 | **Zero bespoke visuals.** At least 2 distinct bespoke scenes (`components/bespoke/<topic>/`) in 2 different scenes, each with `proves`. | a film of generic boxes, icons and stock widgets only | `onecoin/broken-chain` in s1, `onecoin/recruit-pyramid` in s4 |
| 19 | **Display at least 2.2x body.** In any panel with both, largest display `px` / largest body `px`. | 60 px over 40 px = 1.5 | 132 px over 44 px = 3.0 |
| 20 | **No short orphan lines.** In text of 2+ lines, no line is one word of 3 characters or fewer. | "Small habits always" / "win" | "Not more" / "discipline" |
| 25 | **One design system.** Every colour is a role of the chosen palette, every font is in the chosen pairing, every easing is named in the system, and no panel overrides style, palette or pairing. | `"color": "#333333"`, `"font": "Arial"` | `"color": "ink"`, `"font": "Archivo Black"` |

## Motion and sound (needs `work/vfx-plan.json` too)

| # | Rule | FAIL | PASS |
|---|---|---|---|
| 3 | **Max 3.5 s static hold.** No more than 3.5 s between two visual events (cut, beat, widget entrance, effect start). | a 4 s panel with no beats | beats at 1.0 s and 2.0 s in a 3 s panel |
| 4 | **Zero dead velocity over 45 frames.** No stretch longer than 45 frames (1.5 s at 30 fps) in which nothing is moving. | entrance ends at frame 10, next motion at 120 | a whole-panel `push-in` under every panel |
| 9 | **Named easing.** Every beat, widget and transition names an easing from the design system or the built-in list (spring-snappy, spring-bouncy, spring-gentle, spring-heavy, ease-out-expo, ease-out-quint, ease-out-back, ease-out-cubic, ease-in-out-cubic, ease-in-expo, anticipate, overshoot). linear, ease, ease-in, ease-out, ease-in-out are banned. | `"easing": "linear"` | `"easing": "pop"` |
| 21 | **Pattern interrupt in the first 1.5 s.** A visual event lands after frame 0 and by frame 45. | first panel holds 4 s, no beat | a scale snap at 0.7 s |
| 22 | **Max 2 identical transitions in a row.** Plain cuts do not count. | fade-in, fade-in, fade-in | whip-pan-in, cut, wipe-up, wipe-up, flash-cut |
| 23 | **SFX within 2 frames of a keyframe.** Every sound cue sits within 2 frames of a cut, beat, widget or effect start, and every scene has at least one cue. | cue at frame 368, cut at 360 | cue `"at": 0` on the cut, `"at": 0.7` on the beat |

## What the checks read

Storyboard panel fields (all times in seconds from the panel start):

```json
{"id": "s1p2", "duration": 3, "layout": "object", "anchor": "l",
 "transition": {"id": "whip-pan-in", "easing": "snap"},
 "beats": [{"at": 1.2, "duration": 0.4, "kind": "scale", "easing": "pop"}],
 "widgets": [{"id": "checklist-card", "anchor": "tr", "at": 0.5, "easing": "pop",
              "x": 50, "y": 6, "w": 34, "h": 8, "text": "Day 3 streak", "role": "label", "px": 32, "color": "ink", "bg": "surface"}],
 "captions": ["You need a smaller plan", "because big plans collapse"],
 "sfx": [{"id": "tick", "at": 0}],
 "boxes": [{"id": "h", "kind": "text", "role": "display", "text": "A smaller plan", "lines": ["A smaller", "plan"],
            "x": 8, "y": 18, "w": 70, "h": 24, "px": 132, "color": "primary", "bg": "bg", "font": "Archivo Black"},
           {"id": "cap", "kind": "caption", "role": "caption", "x": 8, "y": 68, "w": 74, "h": 8, "px": 56, "color": "ink", "bg": "bg"}]}
```

- `boxes`: x, y, w, h are percent of the frame from the top-left. `kind` is text, caption, face, card,
  widget, subject or decor. Text needs `role` (display, body, label, caption), `px`, `color`, `bg`.
- `color` and `bg` are palette role names, never hex.
- Effects and their timing come from `work/vfx-plan.json`; it may also carry `"sfx": [{"id", "frame"}]`.
- A complete passing film is in `scripts/fixtures/tells-pass/`; one that trips every rule is in
  `scripts/fixtures/tells-fail/`. `node scripts/check-ai-tells.js --selftest` proves both.

Related zero-token checks, already included in rules 16, 17 and 25:
`node scripts/check-design.js work` and `node scripts/check-safezones.js work`.
