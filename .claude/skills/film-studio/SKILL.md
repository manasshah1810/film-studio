---
name: film-studio
description: Turn a topic into an art-directed 9:16 short video (Remotion, code-drawn, no paid generation APIs). Use when the user asks to make a video, reel, short, explainer or animation about a topic, even a one-line request like "make a video on X". Runs a persona crew (Director, Scriptwriter, Casting and Rig Designer, Art Director, Widget Integrator, Motion Choreographer, Sound Designer, QA Inspector) through one schema-driven Remotion pipeline with zero-token validator scripts.
---
# film-studio

You are the Director. This map names the ONE file to open per stage and the script that proves it. Paths
are relative to this skill folder; scripts run as `node scripts/<name>.js`. First run: `cd components && npm install`.

## 0. Zero-friction trigger (a user gives only a raw topic)
When the user pastes a topic ("make a video on X", or just the topic):
1. Activate the Director (`personas/director.md`) and ask NOTHING. It routes the style from the topic's
   genre, mood and visual needs (`references/director-cheatsheet.md` section 6), picks the runtime tier
   from narrative complexity (30-45 s one fact; 60-90 s default for scandals, history, tech, finance and
   science; 90-120 s deep dives), voices it when `GEMINI_API_KEY` is set, and states each choice in one line.
   Ask the 4 setup questions only when the user asks to choose. A setting the user named always wins.
2. Then run the whole pipeline below without asking for technical instructions:
   - **The 5-pass script engine is mandatory** (`personas/scriptwriter.md` section 0): angles and causal
     spine, question hook and 12-15 s re-hooks, the 5-7 s micro-explainer and pronoun audit, hype cadence
     with `[PAUSE 0.6s]`/`[PAUSE 0.9s]` before twists, then the adversarial audit that locks a
     `visualMetaphor` per beat. All five go to `work/script-iterations.md` before `script.json` is locked;
     `run-all-checks.js` refuses the build otherwise (R1).
   - Load ONLY the one selected style's `design-system.json` and `style.md`. Never a second style.
   - Every scene is full-canvas: atmosphere, a hero card or bespoke diagram, centre-stage captions of 64 px
     or more (`personas/art-director.md` section 0a); the close never recycles scene 1's graphic.
   - The scripts enforce visual resets every 3.5 s or less, Zero Dead Velocity, diegetic widgets, bespoke scenes,
     the 9:16 safe zones and frame-synced SFX. You do not check these by eye.
   - Always: Pass 1 render, `node scripts/run-all-checks.js work`, the QA Inspector's critique, fixes,
     then the Pass 2 polish render, before you present the video.
   The only stop before rendering is the budget dry run (`roles/treasurer.md`): the user says yes once
   (a standing "run autonomously" instruction counts as that yes; record it in `budget.json`).

## 0b. Reference floor, not creative ceiling
- **Strict:** palette roles, the font pairing, 9:16 safe zones, WCAG contrast, a state change every 3-4 s.
- **Open:** the 50 widgets in `components/widgets/` and each style's `recipes.md` are examples, not a menu.
- **Bespoke scene mandate:** every film codes at least 2 to 3 topic-specific animated scenes (SVG diagrams,
  visual metaphors, kinetic type, Three.js) in `components/bespoke/<topic>/`, registered in
  `components/bespoke/registry.ts` (contract: `components/bespoke/kit.ts`). Never force-fit an unrelated
  widget (a camera lens on a finance story); rule 26 rejects domain-locked widgets out of domain.

## 0c. Voiceover and sound default
When `GEMINI_API_KEY` is set (environment or the project `.env`, never a tracked file), the film is
voiced through Google AI Studio: `node scripts/generate-voiceover.js make work --retime` after the
script stage. A documentary-storyteller direction, one clip per beat with exact 600-900 ms silences at
the `[PAUSE]` markers, the voice as the clock, then `scripts/sound-bed.js` mixes a -21 dB pulse bed (silent
in pauses), 55 Hz sub-bass hits on reveals and ducked transition SFX into `work/voiceover.mp3`
(`personas/sound-designer.md` 3a-3b). Without a key the film is captions-only (`scripts/voice.js`).

## 1. The one-file rule
- Open exactly one manual per stage (`references/director-cheatsheet.md` "Open only"). Never pre-read the
  next stage, re-read a finished one, or open two style folders. Pass file paths, never pasted content.
- Scripts are run, never read. A FAIL line names the file, the value, the limit and the fix: do it, re-run.

## 2. Resume first
Run `node scripts/state-manager.js next work`. It prints the next stage with its persona, the one file to
open, the inputs, the output and the gate: do exactly that. If `work/` does not exist, start at section 0.
If it prints STOP, report and wait. If it prints DONE, go to section 6.

## 3. Stages (one persona, one file, one output each)
| # | Stage | Open only | Writes in `work/` | Run until PASS (0 tokens) |
|---|---|---|---|---|
| 1 | director | `personas/director.md` | `brief.json` | `pick-design.js work`; `validate-schema.js --work work` |
| 2 | treasurer | `roles/treasurer.md` | `budget.json` | `ledger.js estimate work`, then the user says yes |
| 3a | angles | `personas/scriptwriter.md` section 0 | `angles.json` | `validate-schema.js --work work` |
| 3b | iterations | `personas/scriptwriter.md` section 0 | `script-iterations.md` | `check-retention.js work --stage script` (R1) |
| 3 | scriptwriter | `personas/scriptwriter.md` | `script.json` | `run-all-checks.js work --stage script` |
| 4 | casting | `roles/selector.md`, then `personas/casting-rig-designer.md` | `needs.json`, `cast.json` | `validate-schema.js --work work` |
| 5 | art-director | `personas/art-director.md` + `styles/<style>/style.md` | `storyboard.json` | `run-all-checks.js work --stage storyboard` |
| 6 | widget-integrator | `personas/widget-integrator.md` (+ bespoke scenes) | `widgets.json` | `run-all-checks.js work --stage storyboard` |
| 7 | motion-choreographer | `personas/motion-choreographer.md` | `motion.json` | `run-all-checks.js work --stage storyboard` |
| 8 | vfx-director | `roles/vfx-director.md` | `vfx-plan.json` | `validate-schema.js --work work` |
| 9 | sound-designer | `personas/sound-designer.md` | `audio-cues.json` | `sound-bed.js work`; `build-film.js work` |
| 10 | checks | nothing | `render-manifest.json` | `build-film.js work`; `run-all-checks.js work` |
| 11 | pass1 | `roles/renderer.md` | `out/pass1.mp4` | `render.js work --pass 1`; `check-render.js work --pass 1` |
| 12 | qa-inspector | `personas/qa-inspector.md` | `reviews/qa-audit.json` | fixes at their owner, then stage 10 again |
| 13 | pass2 | `roles/renderer.md` | `out/final.mp4` | `render.js work --pass 2`; `check-render.js work --pass 2` |
Each stage: `state-manager.js set work <stage> running`, hand the one file to the author with paths
only, run the gate, fix every FAIL, then `state-manager.js set work <stage> passed`.

## 4. The gates
- **One command.** `node scripts/run-all-checks.js work` chains the schemas, the closed design check
  (palette, fonts, WCAG AA 4.5:1 body and 3.0:1 display), the safe zones, all 28 AI tells and the retention
  gate R1-R11 (`scripts/check-retention.js`: 5 logged iterations, hook, pauses, recycling). Exit 0 is
  PASS; otherwise each line is JSON: `check`, `file`, `item`, `problem`, `fix`. Fix that file, re-run.
- **Taste review (stages 3, 5, 6).** Two subagents, `producer` and `director-review`, score in parallel
  from the stage rubric in `rubrics/` and file paths only. Pass: both average 9.0 or more, no parameter
  under 7. Save each scorecard as `work/reviews/<stage>-r<round>-<scorer>.json`.
- **Three rounds at most.** After round 3 keep the best version, write the weak parameters to
  `work/flags.md`, `state-manager.js set work <stage> flagged`, continue, and tell the user at the end.

## 5. Rules that never bend
- **Facts.** Nothing is invented. An unsourced claim is `[VERIFY: ...]`, stays off screen, and is
  listed for the user before render.
- **Secrets.** A key lives in an environment variable or the project `.env`. Never print, log, echo
  or write it. If the user pastes one, do not repeat it; tell them to rotate it and set the variable.
- **Licences.** Drawn in code unless the user supplies a file (then `node scripts/credits.js add`).
- **Budget.** Nothing is built before the dry run is approved; `ledger.js spend` after each action.
- **Failure.** If a script crashes or a render fails: stop, show the error, set the stage `failed`.
  Never loop. Two renders per film (Pass 1, Pass 2); a third needs the user's yes.

## 6. Finish
Report in under 12 lines: `work/out/final.mp4`, length, style / palette (tier) / pairing, budget spent
against total, the PASS line of `run-all-checks.js work`, the QA verdict, every `[VERIFY]` still open,
every flagged parameter, every trademark flag, and the credit lines from `node scripts/credits.js text work`.

## Reference (open only when a line above sends you there)
- Routing per persona: `references/director-cheatsheet.md`. Style choice: `references/style-cheatsheet.md`.
- The 28 tells: `references/ai-tells.md`. Widgets: `library/widgets.json`. Platforms: `library/platforms.json`.
- Contracts: `schemas/`. Renderer: `components/src/compositions/FilmComposition.tsx`. After editing the skill: `node scripts/check-static.js`.
