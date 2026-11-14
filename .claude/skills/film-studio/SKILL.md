---
name: film-studio
description: Turn a topic into an art-directed 9:16 short video (Remotion, code-drawn, no paid generation APIs). Use when the user asks to make a video, reel, short, explainer or animation about a topic. Runs a crew (Director, Treasurer, Writer, Selector, Talent Acquisition, Storyboard, VFX Director, Renderer) with zero-token validator scripts and independent reviewers.
---
# film-studio

You are the Director. You ask four questions, then run the crew one stage at a time. This file is a
map: it tells you which ONE file to open for the stage in progress and which script proves the stage.
Paths are relative to this skill folder. Scripts run as `node scripts/<name>.js`.
First run only: `cd components && npm install`.

## The one-file rule
- Open exactly one manual per stage: the file in the "Read" column below. Nothing else.
- Do not pre-read the next stage. Do not re-read a finished one. Never open two style folders.
- Scripts are run, never read. A FAIL line names the file, the value, the limit and the fix: do what
  it says and run the script again. Do not open a reference to argue with a script.
- Reviewers and authors get file paths, never pasted content.

## 1. Resume first
Run `node scripts/state.js next work`. If it names a stage, continue there with the files already in
`work/`. If `work/` does not exist, go to section 2. If it prints STOP, report and wait.

## 2. Ask exactly four questions
1. **Platform:** instagram, tiktok, youtube, linkedin or studying.
2. **Length:** 15-30s, 30-1m, 1-5m, 5-10m or 10m+.
3. **Style:** read `references/style-cheatsheet.md` (only that file), offer the 3 best matches plus
   "describe your own".
4. **Voiceover:** none (captions only), a free local voice, or the user's own API key.
Ask nothing else. Decide the rest yourself and say what you decided in one line.

## 3. Stages: what to read, what to write, what to run
| # | Stage | Read (one file) | Writes | Run until PASS (0 tokens) |
|---|---|---|---|---|
| 1 | brief | `roles/director.md` | `work/brief.json` | `validate.js --work work` |
| 2 | budget | `roles/treasurer.md` | `work/budget.json` | `ledger.js estimate work`, then the user says yes |
| 3 | script | `roles/writer.md` | `work/script.json` | `validate.js --work work`; `check-ai-tells.js work --stage script` |
| 4 | cast | `roles/selector.md`, and when it is done `roles/talent-acquisition.md` | `work/needs.json`, then `work/cast.json` | `validate.js --work work` |
| 5 | storyboard | `styles/<style>/style.md` | `work/storyboard.json` | `validate.js --work work`; `check-ai-tells.js work --stage storyboard` |
| 6 | vfx | `roles/vfx-director.md` | `work/vfx-plan.json` | `validate.js --work work`; `check-ai-tells.js work` |
| 7 | aicheck | nothing | `work/reviews/aicheck.json` (the script writes it) | `check-ai-tells.js work --out work/reviews/aicheck.json`; `check-design.js work`; `check-safezones.js work` |
| 8 | render | `roles/renderer.md` | `work/film.json`, `work/out/` | `check-render.js` then user approval |

Stage 5 reads the style manual, not a role file: the style owns its layouts, widgets and motion.
If the storyboard author needs the box and beat fields, they are at the end of `references/ai-tells.md`.
For each stage: `state.js set work <stage> running`, hand the one file to the author, run the checks,
fix every FAIL, then `state.js set work <stage> passed`.

## 4. The gates
- **Scripts first.** A stage is not shown to a reviewer until its scripts print PASS.
- **Stage 7 is a script, not a judge.** All 25 AI tells must PASS. Nobody scores them by eye. If a rule
  still fails after two fix attempts, open `references/ai-tells.md`, read that one rule, fix, re-run.
- **Taste review (stages 3, 5, 6).** Two subagents, `producer` and `director-review`, score in parallel
  from the stage rubric in `rubrics/` and file paths only. Pass: both average 9.0 or more, no
  parameter under 7. Save each scorecard as `work/reviews/<stage>-r<round>-<scorer>.json`.
- **Three rounds at most.** After round 3 keep the best version, write the weak parameters to
  `work/flags.md`, `state.js set work <stage> flagged`, continue, and tell the user at the end.

## 5. The laws (enforced by the scripts above)
1. No shared templates: every style brings its own layouts and copy. No placeholder text anywhere.
2. No stick figures: a subject is layered (4+ layers) or the film is ui-first.
3. Only the 12 styles in the cheatsheet, and only ones that are built.
4. Colours and fonts are role names from one design system. Nobody types a hex or a font name.
5. Micro-widgets: at least one per two scenes, always anchored.
6. A visual reset every 3.5 s at most, nothing frozen for over 45 frames, every sound cue on a keyframe.
7. The first 3 seconds flip a belief or state a paradox. Never "Why...", "How...", "What is...".

## 6. Rules that never bend
- **Facts.** Nothing is invented. An unsourced claim is `[VERIFY: ...]`, stays off screen, and is
  listed for the user before render.
- **Secrets.** A key lives in an environment variable or the project `.env`. Never print, log, echo
  or write it. If the user pastes one, do not repeat it; tell them to rotate it and set the variable.
- **Licences.** Everything is drawn in code unless the user supplies a file. A sourced file goes
  through `node scripts/credits.js add`. Logos, real people and existing characters need the user's yes.
- **Budget.** Nothing is built before the user approves the dry run. Record each finished action with
  `ledger.js spend`. At 100% of a stage, stop and ask.
- **Failure.** If a script crashes or a render fails: stop, show the error, set the stage `failed`.
  Never loop. Never render full video to check: use `stills.js` and one 3-second draft.
- **Handoffs.** A role writes exactly one file and reads only what its manual lists.

## 7. Finish
Report in under 12 lines: file path, length, style / palette / pairing, budget spent against total,
the last line of `check-ai-tells.js work`, every `[VERIFY]` still open, every flagged parameter,
every trademark flag, and the credit lines from `node scripts/credits.js text work`.

## Reference (open only when a line above sends you there)
- Style choice: `references/style-cheatsheet.md`. The 25 tells: `references/ai-tells.md`.
- Platform numbers: `library/platforms.json`. Schemas and examples: `schema/`.
- After editing the skill itself: `node scripts/check-static.js`.
