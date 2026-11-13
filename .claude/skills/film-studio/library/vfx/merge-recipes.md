# VFX merge recipes

How to combine effects from the five category files in this folder. Every id below exists in the
library and has a component; `node scripts/check-static.js` fails if that ever stops being true.

## 1. What a merge is
A merge puts two or three effects on one panel with the same `start` and `duration`, so they read as
one event. In `work/vfx-plan.json` the lead effect is `effect_id`, the others go in `merged_with`
(two at most). Merged effects run with their library defaults; only the lead takes `params`.

## 2. Entry format (category files)
Each file is `{"category": "...", "entries": [...]}`. One entry:
| field | meaning |
|---|---|
| `id` | lowercase with hyphens; unique across the library; the only way to refer to an effect |
| `window` | `in` starts at 0 s; `out` ends with the panel; `hit` is short, anywhere; `whole` runs the full panel |
| `default_seconds` | a starting duration; 0 on `whole` effects means "use the panel length" |
| `tags` | what kind of effect it is; styles ban tags, not ids (`library/vfx/style-rules.json`) |
| `cost_units` | budget units, added up by `scripts/validate.js` |
| `what_it_does`, `when_to_use`, `when_not_to_use` | read all three before choosing |
| `params` | every allowed key with its default; colours are a palette `role` |

## 3. Rules the validator enforces
- Three effects per panel at most, merged ones included.
- An effect whose tags include one the film's style bans is rejected.
- `in` effects start at 0; `out` effects end on the panel's last frame; nothing runs past the panel.
- Unknown ids and unknown params are rejected.
It warns when two effects on a panel share a tag (two zooms, two flashes) and when a scene has more
than two hit effects.

## 4. Merges that work
| Name | Lead + merged | Reads as | Not in styles that ban |
|---|---|---|---|
| Impact | `camera-shake` + `flash` | something hit | shake, flash |
| Hard landing | `impact-squash` + `speed-lines` | a heavy thing arrives | bounce, decor |
| Reveal | `iris-in` + `bloom` | attention opens on one thing | glow |
| Whip between places | `whip-pan-out` on panel A, `whip-pan-in` on panel B | one fast move across a cut | blur, slide, snap |
| Zoom through | `zoom-through-out` on A, `zoom-through-in` on B | flying into the next idea | zoom, blur, fade |
| Old footage | `film-grain` + `dust-specks` + `vignette` | archive, memory | gradient |
| Bad signal | `glitch-cut` + `vhs-tracking` | a system failing | glitch, continuous |
| Win | `confetti-burst` + `bounce-settle` | celebration | party, decor, bounce |
| Dread | `push-in` + `vignette-pulse` | the room closing in | zoom, gradient, pulse |
| Lights out | `night-fall` + `desaturate` | hope draining | none |
| Spotlight a number | `spotlight` + `punch-in` | this figure is the point | gradient, zoom, snap |
| Morning | `warm-up` + `floating-dust` | relief, a new start | decor, blur |
| Poster change | `color-plate-wipe` alone, same `role` all film | a print being swapped | none |
| Tension tick | `heartbeat-pulse` + `progress-bar` | time running out | pulse |

## 5. Merges that never work
- Two camera moves at once (`push-in` with `pan-left`): the frame swims.
- A blur with a text-heavy panel (`rack-focus` over a `list`): nobody can read it.
- `strobe` with any other flash, or any flash within a third of a second of another.
- A texture the style already has (`film-grain` on noir, `halftone-overlay` on comic or riso,
  `paper-grain` on cutout, watercolor or sketchbook): the two patterns fight.
- An `out` transition without its matching `in` on the next panel.
- Anything merged with `invert-hit`: it must stand alone to read.

## 6. Timing a merge
- All parts share one start and one duration. If they need different timing they are not a merge:
  list them as separate entries.
- A hit merge lands on the stressed word in the narration. Find the word's place in the panel
  (words before it divided by the scene's speaking rate) and start there.
- Effects are stepped to the style's hold by the engine: on twos in cutout, riso and comic
  films, on fours in pixel. Durations under four frames can vanish on a held style; keep hit effects
  at 0.2 s or longer.
