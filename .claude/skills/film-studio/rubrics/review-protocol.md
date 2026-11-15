# Review protocol

How a stage is judged. Applies to the script, cast, storyboard and vfx stages, and to style proofs.
The author never scores. Two reviewers score independently and neither sees the other's card.

## 1. Who reviews
- `producer` (agent): scores as the person who answers to the audience and the platform. Will it hold
  attention, is it clear, is it honest, does it fit the brief.
- `director-review` (agent): scores as the person who answers for the craft. Is the idea sharp, is
  the style used as designed, is every choice deliberate.
- AI tells are not reviewed by an agent. `scripts/check-ai-tells.js` checks all 28 (`references/ai-tells.md`).
Both reviewers get the same rubric and the same file paths. They are launched in the same message.

## 2. What a reviewer receives
- The stage's output file and only the inputs its rubric lists.
- For stages with a picture: the path of one low-resolution proof sheet. Never video.
- The round number. On round 2 or 3: their own previous scorecard, so they can check the fix.
They do not receive the author's reasoning, the other reviewer's card, or the chat history.

## 3. Scoring
- Each rubric has exactly 10 parameters. Score each from 1 to 10, whole or half points.
- Use the anchors in the rubric: its "9-10" column and its "6 or below" column.
  - 10: could not be improved in a way a viewer would notice.
  - 9: meets the 9 anchor everywhere; at most a matter of taste remains.
  - 8: one small, specific weakness. Name it.
  - 7: a real weakness that a viewer might notice. Name it and where.
  - 6 or below: matches the low anchor somewhere.
- Every score under 9 needs evidence: the scene, panel or asset id, and what is wrong there.
  A score under 9 with no id is invalid and `scripts/validate-schema.js` rejects the card.
- Score what is in the files. Do not reward effort, intention or length, and do not penalise a choice
  only because you would have made another.
- A reviewer who cannot open a file scores nothing and reports it. No guessing.

## 4. The scorecard
Reviewers cannot write files. Each returns one JSON scorecard as its whole final message and the
Director saves it unchanged as `work/reviews/<stage>-r<round>-<scorer>.json`
(`schemas/scorecard.schema.json`; example in `schemas/example.scorecard.json`).
- `params`: ten entries, in rubric order, each with `name`, `score`, `evidence`.
- `average`: mean of the ten, two decimals. `minimum`: the lowest score.
- `passed`: true only if average is 9.0 or more AND minimum is 7 or more.
- `feedback`: up to five instructions for the author, most important first. Each one names an id and
  says what to change, not how the reviewer feels.
`node scripts/validate-schema.js scorecard <file>` checks the arithmetic and the gate.

## 5. The gate
A stage passes when BOTH scorecards have `passed: true`.

## 6. Rounds
- Round fails: the Director gives the author both scorecards. The author revises only what they name.
- At most three rounds per stage. Each round is recorded with `scripts/ledger.js`.
- After round 3 without a pass:
  1. Keep the version with the highest combined average.
  2. Append to `work/flags.md`: the stage, both averages, and every parameter under 9 with its evidence.
  3. `node scripts/state-manager.js set work <stage> flagged`, and continue.
  4. The Director lists the flags in the final report. A flagged film is delivered as flagged, never
     described as passing.

## 7. Disagreement
- If the two averages differ by more than 1.5, the Director re-reads the evidence. A card whose low
  scores cite no id is sent back to that reviewer once.
- The Director does not average the two cards and does not overrule a score.

## 8. What reviewers never do
- Never edit the file under review, never suggest text to paste, never score their own suggestion.
- Never raise a score because the round limit is near.
- Never see or ask for a secret.
