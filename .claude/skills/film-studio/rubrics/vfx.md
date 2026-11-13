# VFX rubric

For `work/vfx-plan.json`. Reviewers also read `work/storyboard.json`, the beats and emotions in
`work/script.json`, `library/vfx/style-rules.json`, and the library entries the plan uses.
Protocol and gate: `rubrics/review-protocol.md`.

| # | Parameter | 9-10 looks like | 6 or below when |
|---|---|---|---|
| 1 | Restraint | Effects on a third of panels or fewer; most panels are clean; nothing would be missed if one more were cut. | An effect on most panels, or effects that only "add energy". |
| 2 | Motivation | Every `reason` names the script beat or word the effect serves, and the effect's meaning matches it. | Reasons that describe the effect instead of the story, or copy the library text. |
| 3 | Peak placement | The strongest hit effect lands on the film's turn or peak panel and nowhere else. | The big effect is spent on the hook or scattered. |
| 4 | Style obedience | No effect carries a tag the style bans; none repeats what the kit already draws; the film still looks like its style. | A banned tag, or an overlay that fights the style's own texture. |
| 5 | Transition logic | One transition family for the whole film, at scene boundaries only; outs and ins are paired. | Mixed transition types, transitions inside scenes, or an out with no matching in. |
| 6 | Timing | Starts and durations sit on the stressed word or the cut; windows are respected; hit effects stay short. | Effects that drift over the read, or run the whole panel when a hit was meant. |
| 7 | Merges | Merged effects share timing and read as one event; no panel has two effects of the same kind. | Stacked zooms or flashes; three effects where one would do. |
| 8 | Readability preserved | No effect covers, blurs or moves text while it must be read. | Blur, shake or particles over body text or captions. |
| 9 | Safety and platform | No more than three flashes in any second; no strobe for children or study; the first frame works as a cover; loops are not broken by a fade or curtain. | Rapid flashing, or an "in" effect that leaves frame one blank. |
| 10 | Cost awareness | Total units fit the vfx allowance; optional effects are marked so the Treasurer can cut them. | Over allowance, or nothing marked optional in a tight budget. |

## How to check
- Count: panels with effects divided by all panels. Over one third: parameter 1 is under 9 unless the
  brief asks for a high-energy edit.
- For each effect, open its library entry and read `when_not_to_use`. If the panel matches, score the
  relevant parameter 7 or lower and quote the line.
- Parameter 4: `node scripts/validate.js vfx-plan work/vfx-plan.json` reports banned tags and window
  errors. A plan that fails validation cannot score above 6 on parameter 4.
- Parameter 8: check each effect's panel in the storyboard for `sub`, `items`, `points`, a long
  `quote` or a caption.
- An empty plan is valid. Score it on whether the film needed anything: a calm film with no effects
  can score 9 or more on every parameter.
- Evidence always cites a panel id and an effect id.
