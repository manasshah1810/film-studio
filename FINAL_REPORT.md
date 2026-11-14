# FINAL_REPORT: OneCoin film-studio run

**Status: INCOMPLETE. Pass 1 rendered; QA and Pass 2 not run.** `work/out/pass1.mp4` (540x960, 30 fps, 45.0 s, 3.6 MB, no audio, safe zones drawn). No `final.mp4`, no QA audit, no Pass 2 polish.

## Setup
Instagram Reels, 48 s target (script runs 45.0 s), `dark-neon-dataviz` / `obsidian-cyan` (focused) / `grotesk-inter-jb`, captions only, seed `onecoin-scam-20261114-1`. Budget dry run 46 of 100 units, treated as approved from the "full autonomous" note.

## Stage results (work files in `.claude/skills/film-studio/work/`)
| Stage | Result |
|---|---|
| script | flagged after round 3: Producer 8.8, Director-review 8.7 (gate 9.0). Automated checks pass. All facts carry a source URL; none is open as [VERIFY]. |
| casting | passed. Props only (coin, cash), ui-first style. |
| storyboard | flagged after round 3: Producer 8.1, Director-review 8.0. 15 panels, automated checks pass. No proof sheet (stills only when asked). |
| widgets | flagged: no widget rubric exists, taste review skipped. Three widgets, script words only. |
| motion | passed (script checks). Largest reset gap 96 frames. |
| vfx | flagged: round 1 only (8.3 / 8.1); fixes applied, not re-reviewed. Two effects. |
| sound | cue sheet passes `build-film.js`, but no audio files exist, so all 35 cues are silent and there is no music bed. |
| checks | `run-all-checks.js work` PASS (schemas, design, safe zones, 25 AI tells). |
| pass1 | PASSED on the second attempt. First attempt failed (Remotion could not download Chrome, `ENOTFOUND remotion.media`). Rerun with `REMOTION_BROWSER_EXECUTABLE=/opt/pw-browsers/chromium` (new opt-in env var in `scripts/render.js`). A second failure came from the widgets receiving no props (live-cursor and banknote crashed); props are now set on the storyboard widgets. `check-render.js` warns the pixel format is yuvj420p, not yuv420p. |

Weak parameters are logged in `work/flags.md`.

## Caveats
- s1p1 chart shows a Bitcoin line with invented values, labelled "Illustrative data" on screen.
- `work/brief.json` angle still contains an unused `[VERIFY: no public blockchain existed]`; the script does not make that claim.
- Facts rest on search-result summaries (The Block, Blockworks), not on primary DOJ documents. Check before publishing.
- Budget spent: see `work/budget.json` (casting 2 units recorded).

## Next step
Run the QA Inspector on `work/out/pass1.mp4`, fix defects at their owners, then Pass 2 (`REMOTION_BROWSER_EXECUTABLE=/opt/pw-browsers/chromium node scripts/render.js work --pass 2`). Sound files still need to exist for the film to have audio.
