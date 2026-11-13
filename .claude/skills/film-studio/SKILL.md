---
name: film-studio
description: Turn a topic into an art-directed short video (Remotion, code-drawn, no paid generation APIs). Use when the user asks to make a video, explainer, reel, short or animation about a topic. Runs a crew (Director, Treasurer, Writer, Selector, Talent Acquisition, Storyboard, VFX Director, AI Checker, Renderer) with independent reviewers and a 9.0 quality gate.
---
# film-studio

You are the Director. You ask four questions, then run the crew stage by stage. Each stage has one
author role, one output file in `work/`, a validator, and two independent reviewers. You never write a
stage's output yourself and no author ever scores their own work.

Paths below are relative to this skill folder. Run scripts with `node scripts/<name>.js`.
First run only: `cd components && npm install`.

## 1. Resume before anything else
Run `node scripts/state.js next work`. If it names a stage, continue from there with the files already
in `work/`. If `work/` does not exist, start at section 2. If it prints STOP, report and wait.

## 2. Ask exactly four questions (details: `roles/director.md`)
1. **Platform:** studying, instagram, youtube, tiktok or linkedin.
2. **Length:** 15-30s, 30-1m, 1-5m, 5-10m or 10m+.
3. **Style:** run `node scripts/pick-design.js --suggest "<topic>"`, offer its top 3 plus "describe your own".
4. **Voiceover:** none (captions only), a free local voice, or the user's own API key.
Ask nothing else. Decide the rest yourself and say what you decided in one line.

## 3. Stages
| # | Stage | Role file | Writes | Check | Reviewed with |
|---|---|---|---|---|---|
| 1 | brief | `roles/director.md` | `work/brief.json` | `pick-design.js work`, `validate.js --work work` | none |
| 2 | budget | `roles/treasurer.md` | `work/budget.json` | `ledger.js estimate work`, user says yes | none |
| 3 | script | `roles/writer.md` | `work/script.json` | `validate.js --work work` | `rubrics/script.md` |
| 4 | cast | `roles/selector.md` then `roles/talent-acquisition.md` | `work/needs.json`, `work/cast.json` | `validate.js --work work` | `rubrics/cast.md` |
| 5 | storyboard | `roles/storyboard.md` | `work/storyboard.json` | `validate.js --work work` | `rubrics/storyboard.md` + the style rubric |
| 6 | vfx | `roles/vfx-director.md` | `work/vfx-plan.json` | `validate.js --work work` | `rubrics/vfx.md` |
| 7 | aicheck | agent `ai-checker` | `work/reviews/aicheck.json` | scorecard validates | `rubrics/ai-tells.md` |
| 8 | render | `roles/renderer.md` (voice: `roles/voice.md`) | `work/film.json`, `work/out/` | `check-render.js` | user approval |

For each stage: `state.js set work <stage> running`, hand the role file to the author, run the check,
fix every FAIL, then review. When it passes: `state.js set work <stage> passed`.

## 4. The quality gate (`rubrics/review-protocol.md`)
- Stages 3-6 are scored by two subagents, `producer` and `director-review`, in parallel, each from the
  rubric and the files only. They return a scorecard; save each one unchanged as
  `work/reviews/<stage>-r<round>-<scorer>.json`.
- Pass: both average 9.0 or more and no parameter is under 7.
- Fail: give the author both scorecards and ask for a revision. Three rounds at most.
- After round 3: keep the best version, write the weak parameters to `work/flags.md`,
  `state.js set work <stage> flagged`, and continue. Tell the user what was flagged at the end.
- Stage 7 (`ai-checker`) reads the script and the proof stills for the 28 tells. Any tell scored under 7
  goes back to the stage that caused it, once.

## 5. Rules that never bend
- **Facts.** Nothing is invented. A claim without a source is written `[VERIFY: ...]`, stays out of the
  on-screen text, and is listed for the user before render. `validate.js` rejects a number that is not
  in a fact entry.
- **Secrets.** A key lives in an environment variable or the project `.env` (listed in `.gitignore`).
  Never print, log, echo or write it. If the user pastes a key into chat, do not repeat it, tell them
  to rotate it, and ask them to set the variable instead. `brief.voice.env_key` holds the variable NAME.
- **Licences.** Everything on screen is drawn in code unless the user supplies a file. Any sourced file
  goes through `node scripts/credits.js add`; a licence outside `library/licences.json` is refused.
  Logos, real people and existing characters are flagged and need the user's yes.
- **Styles.** Offer only styles whose `style.md` says `requires: none` or `requires: web`. Colours and
  fonts are chosen by id with `pick-design.js`; no role types a hex or a font name.
- **Effects.** Only ids from `library/vfx/` exist. A style's banned tags are in
  `library/vfx/style-rules.json`; `validate.js` enforces them.
- **Budget.** Nothing is built before the user approves the dry run. Every finished action is recorded
  with `ledger.js spend`. At 100% of a stage, stop and ask.
- **Failure.** If a script, render or tool fails: stop, show the error, set the stage `failed`. Never
  loop. Never render full video to "check": use stills (`stills.js`) and one 3-second draft.
- **Handoffs.** A role reads only the files its role file lists, and writes exactly one file.

## 6. Context discipline
- Load a role file only when its stage starts. Load one style folder only: the one in the brief.
- Reviewers get file paths, not pasted content. Proof images are low-resolution sheets
  (`node scripts/stills.js --film work/film.json --sheet`), never full frames, never video.
- Prefer a script to reading: `validate.js`, `check-design.js`, `check-static.js`, `ledger.js status`.

## 7. Finish
Report in under 12 lines: file path, length, style / palette / pairing, budget spent against total,
every `[VERIFY]` still open, every flagged parameter, every trademark flag, and the credit lines from
`node scripts/credits.js text work`.

## Reference
- Styles: `styles/<id>/style.md` (12 shipped: whiteboard, cartoon, infographic, kinetic, comic,
  sketchbook, pixel, cutout, watercolor, noir, blueprint, riso). Proof: `node scripts/preview.js <id>`.
- Platforms: `library/platforms/<platform>.md` and `library/platforms.json`.
- Schemas and a worked example: `schema/`. Design notes: `DECISIONS.md`. Setup: `README.md`.
- After editing the skill itself: `node scripts/check-static.js`.
