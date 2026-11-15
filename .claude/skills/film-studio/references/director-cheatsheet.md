# Director cheatsheet: one file per persona

The Director's routing card. Each stage opens exactly ONE manual, reads at most the inputs listed,
writes exactly ONE file in `work/`, and is proved by a script, not by eye. `node scripts/state-manager.js
next work` prints the same row for the stage to run now, so a resumed session never re-reads this file.

## 1. The pipeline (15 stages, in order)
| # | Stage (state-manager) | Persona | Open only | Inputs from `work/` | Writes | Gate (0 tokens) |
|---|---|---|---|---|---|---|
| 1 | `director` | Director | `personas/director.md`; section 6 below at Q3 | none | `brief.json` | `pick-design.js work`; `validate-schema.js --work work` |
| 2 | `treasurer` | Treasurer | `roles/treasurer.md` | brief | `budget.json` | `ledger.js estimate work`, then the user's yes |
| 3a | `angles` | Scriptwriter | `personas/scriptwriter.md` section 0 | brief | `angles.json` | `validate-schema.js --work work` |
| 3b | `iterations` | Scriptwriter | `personas/scriptwriter.md` section 0 | brief, angles | `script-iterations.md` (Iterations 1 to 5) | `check-retention.js work --stage script` (R1) |
| 3 | `scriptwriter` | Scriptwriter | `personas/scriptwriter.md` | brief, angles, script-iterations | `script.json` (the locked Iteration 5) | `run-all-checks.js work --stage script` (rule 28, R1 to R9) |
| 4 | `casting` | Selector, then Casting and Rig Designer | `roles/selector.md`, then `personas/casting-rig-designer.md` | script, brief, needs | `needs.json`, then `cast.json` | `validate-schema.js --work work` |
| 5 | `art-director` | Art Director | `personas/art-director.md` + `styles/<style>/style.md` | script, cast | `storyboard.json` | `run-all-checks.js work --stage storyboard` |
| 6 | `widget-integrator` | Widget Integrator | `personas/widget-integrator.md` | script, storyboard | `widgets.json` | `run-all-checks.js work --stage storyboard` |
| 7 | `motion-choreographer` | Motion Choreographer | `personas/motion-choreographer.md` | script, storyboard, widgets | `motion.json` | `run-all-checks.js work --stage storyboard` |
| 8 | `vfx-director` | VFX Director | `roles/vfx-director.md` | storyboard, brief | `vfx-plan.json` | `validate-schema.js --work work` |
| 9 | `sound-designer` | Sound Designer | `personas/sound-designer.md` | storyboard, motion, widgets, vfx-plan | `audio-cues.json` | `build-film.js work` (every cue must land on a keyframe) |
| 10 | `checks` | scripts only | nothing | everything | `render-manifest.json`, `reviews/checks.json` | `build-film.js work`; `run-all-checks.js work` |
| 11 | `pass1` | Renderer | `roles/renderer.md` | render-manifest | `out/pass1.mp4` | `render.js work --pass 1`; `check-render.js work --pass 1` |
| 12 | `qa-inspector` | QA Inspector | `personas/qa-inspector.md` | work/, stills, pass1 | `reviews/qa-audit.json` | each defect fixed at its owner, then stage 10 again |
| 13 | `pass2` | Renderer | `roles/renderer.md` | render-manifest | `out/final.mp4` | `render.js work --pass 2`; `check-render.js work --pass 2` |
Scripts live in `scripts/` and run from the skill folder as `node scripts/<name>.js`.

## 2. The dispatch line (paths only, never pasted content)
`Read <manual>. Inputs: <paths>. Seed: <design.seed>. Write work/<file>. Run <gate> until PASS. Open nothing else.`
Before: `node scripts/state-manager.js set work <stage> running`. After the gate and, for stages 3, 5
and 6, the two taste reviewers: `node scripts/state-manager.js set work <stage> passed`. Drop the
finished manual from context.

## 3. What each persona file decides (so you never open it to check)
| Persona | Owns | Hard numbers it enforces |
|---|---|---|
| Director | platform, length, style, voice, palette tier, seed | focused 3-5 colours, expanded 8-12 |
| Scriptwriter | angles, the 5 iterations, hook, causal chain, captions, facts | 6-8 scored angles, top 3-4 only; 5 logged passes; question hook in 4 s; re-hook every 12-15 s; one 5-7 s explainer; `[PAUSE 0.6s]`/`[PAUSE 0.9s]` before twists; a `visualMetaphor` per beat; headline 2-4 power words; `[VERIFY: ...]` on every unsourced claim |
| Casting and Rig Designer | narrators, actors, props | 4 or more named layers; ui-first styles get props only |
| Art Director | boxes, colours, type, which beats get bespoke scenes | 3-layer full canvas (atmosphere, hero card, centre-stage captions >= 64 px); contrast 4.5:1 body, 3.0:1 display; display at least 2.2x body; 2-3 bespoke scenes; a unique closing frame |
| Widget Integrator | library widgets that fit, and the bespoke scene code | ids from `library/widgets.json`, never out of `domain`; bespoke in `components/bespoke/<topic>/`; one proof per two scenes; box inside x 6-85, y 8-80 |
| Motion Choreographer | resets and primitives | a visual reset every 3.5 s at most; nothing still for 45 frames |
| VFX Director | effect wrappers | ids from `library/vfx/`; style bans in `library/vfx/style-rules.json` |
| Sound Designer | cues and the 3-layer mix | onset within 2 frames of its peak; pulse bed -21 dB, silent in every pause; 55 Hz hits on reveals; SFX ducked under the voice |
| QA Inspector | the verdict on Pass 1 | `run-all-checks.js` clean, then the 10-parameter craft rubric |

## 4. Where the render reads it
`scripts/build-film.js` joins the files into `work/render-manifest.json` (`schemas/render-manifest.schema.json`).
`components/src/compositions/FilmComposition.tsx` renders only that file: it looks up the style's
`design-system.json` by id, draws layered narrators and actors or a UI-first frame, mounts widgets
through `components/widgets/registry.ts` and bespoke scenes through `components/bespoke/registry.ts`, runs the motion modules in `components/motions/`, plays the
cues on their frames and ducks music under the voice. `showSafeZones` draws the 9:16 dead zones on Pass 1.

## 5. When to stop
- A script FAILs twice on the same line after a fix: stop, report the line, `set work <stage> failed`.
- A render or tool crashes: report the error, never retry in a loop.
- A stage reaches review round 3: keep the best version, list the weak parameters in `work/flags.md`,
  `set work <stage> flagged`, continue, and tell the user at the end.

## 6. Autonomous style routing (Q3 when the user names no style)
Classify the topic into ONE genre, then take the first pick unless a tie-breaker below moves it. Every
style here is `requires: none`; never route to a style that needs a paid generation API.
| Genre (signals in the topic) | 1st pick | 2nd | 3rd |
|---|---|---|---|
| Scandal, fraud, investigation, true crime, cover-up | `archival-grunge` | `dark-neon-dataviz` | `2-5d-parallax-depth` |
| Finance, business, markets, money, startups | `dark-neon-dataviz` | `hormozi-kinetic` | `low-poly-isometric` |
| Tech, AI, software, cyber, gadgets | `scifi-hud` | `glowing-plexus` | `neo-brutalist-ui` |
| History, war, geopolitics, mythology, empires | `tactical-vector-maps` | `2-5d-parallax-depth` | `voxel-art` |
| Psychology, habits, self-help, relationships | `minimalist-doodle` | `hormozi-kinetic` | `glowing-plexus` |
| Science, engineering, anatomy, space | `holographic-wireframe` | `glowing-plexus` | `scifi-hud` |
| Systems, economics, cities, supply chains | `low-poly-isometric` | `dark-neon-dataviz` | `tactical-vector-maps` |
| Gaming, pop culture, kids, simple explainers | `voxel-art` | `minimalist-doodle` | `neo-brutalist-ui` |
Tie-breakers, in order (write the one that decided it into `brief.style_reason`):
1. **Visual need of the twist.** The reveal is a number that was never real: dataviz. A document, a
   person, a court case, a wanted poster: archival. A route or a border: maps. A machine or a flow: isometric.
2. **Mood.** Tense or dark stories take a dark palette tier of the pick (true-crime, bear-market...);
   warm or helpful stories take a light one.
3. **Two genres** (a financial fraud, an AI scandal): the genre of the hook question wins; the other
   genre's first pick becomes the source of one bespoke scene idea, never a second style.
4. **Freshness.** If the last film in this project used the same style for the same topic, take the 2nd pick.
