# FINAL_REPORT: OneCoin film-studio run

**Status: QA-REJECTED after three audits (7.1, 7.9, 7.9; gate 9.0, no parameter under 7).** `work/out/final.mp4` (1080x1920, 45.0 s, audio) is from before the last round of fixes. The storyboard now contains those fixes but they are not rendered. Not pushed to main.

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
| qa-inspector | rejected twice: 7.1 then 7.9, min 7, no blockers. Open majors: s2p2 near-empty, s3p1 near-empty, coin prop repeated in 7 of 15 panels. |
| qa round 3 | rejected, 7.9: major defects (s2p2, s3p1, prop repetition) improved but still partial; no blockers. |
| pass2 | PASSED render: `final.mp4`, `check-render.js` PASS (warns yuvj420p pixel format). |
| pass1 | PASSED on the second attempt. First attempt failed (Remotion could not download Chrome, `ENOTFOUND remotion.media`). Rerun with `REMOTION_BROWSER_EXECUTABLE=/opt/pw-browsers/chromium` (new opt-in env var in `scripts/render.js`). A second failure came from the widgets receiving no props (live-cursor and banknote crashed); props are now set on the storyboard widgets. `check-render.js` warns the pixel format is yuvj420p, not yuv420p. |

Weak parameters are logged in `work/flags.md`.

## Caveats
- s1p1 chart shows a Bitcoin line with invented values, labelled "Illustrative data" on screen.
- `work/brief.json` angle still contains an unused `[VERIFY: no public blockchain existed]`; the script does not make that claim.
- Facts rest on search-result summaries (The Block, Blockworks), not on primary DOJ documents. Check before publishing.
- Budget spent: see `work/budget.json` (casting 2 units recorded).

## Next step
Fix the open majors (storyboard s2p2, s3p1, prop variety), rebuild, rerun QA. A third render needs a yes. Audio is synthesized in code (`work/audio/`), sync unverified by ear. Push to main is waiting on a decision.
