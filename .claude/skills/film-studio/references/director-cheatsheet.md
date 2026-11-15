# Director cheatsheet: one file per persona

The Director's routing card. Each stage opens exactly ONE manual, reads at most the inputs listed,
writes exactly ONE file in `work/`, and is proved by a script, not by eye. `node scripts/state-manager.js
next work` prints the same row for the stage to run now, so a resumed session never re-reads this file.

## 1. The pipeline (14 stages, in order)
| # | Stage (state-manager) | Persona | Open only | Inputs from `work/` | Writes | Gate (0 tokens) |
|---|---|---|---|---|---|---|
| 1 | `director` | Director | `personas/director.md`; `references/style-cheatsheet.md` at Q3 | none | `brief.json` | `pick-design.js work`; `validate-schema.js --work work` |
| 2 | `treasurer` | Treasurer | `roles/treasurer.md` | brief | `budget.json` | `ledger.js estimate work`, then the user's yes |
| 3a | `angles` | Scriptwriter | `personas/scriptwriter.md` section 0 | brief | `angles.json` | `validate-schema.js --work work` |
| 3 | `scriptwriter` | Scriptwriter | `personas/scriptwriter.md` | brief, angles | `script.json` | `run-all-checks.js work --stage script` (rule 28) |
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
| Scriptwriter | angles, hook, causal chain, captions, facts | 6-8 scored angles, top 3-4 only; 3 s assumption-flip hook; headline 2-4 power words; caption chunks of 5 words or fewer; `[VERIFY: ...]` on every unsourced claim |
| Casting and Rig Designer | narrators, actors, props | 4 or more named layers; ui-first styles get props only |
| Art Director | boxes, colours, type, which beats get bespoke scenes | contrast 4.5:1 body, 3.0:1 display; display at least 2.2x body; 2-3 bespoke scenes |
| Widget Integrator | library widgets that fit, and the bespoke scene code | ids from `library/widgets.json`, never out of `domain`; bespoke in `components/bespoke/<topic>/`; one proof per two scenes; box inside x 6-85, y 8-80 |
| Motion Choreographer | resets and primitives | a visual reset every 3.5 s at most; nothing still for 45 frames |
| VFX Director | effect wrappers | ids from `library/vfx/`; style bans in `library/vfx/style-rules.json` |
| Sound Designer | cues, music bed, ducking | onset within 2 frames of its peak; bed ducked under the voice |
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
