# Script rubric

For `work/script.json`. Reviewers also read `work/brief.json` and the platform file.
Protocol and gate: `rubrics/review-protocol.md`.

| # | Parameter | 9-10 looks like | 6 or below when |
|---|---|---|---|
| 1 | Hook | The first line creates a question or tension inside the platform's hook window and could not open a different video. | It greets, announces the topic, or states a fact with no tension. |
| 2 | One idea | The whole script can be summed up in one sentence of 12 words or fewer, and every scene serves it. | Two ideas compete, or a scene could be cut without loss. |
| 3 | Structure and turn | Beats are clear (hook, setup, turn, payoff, close) with exactly one turn, placed where it lands hardest. | A list of points with no turn, or the turn arrives in the last line. |
| 4 | Fact discipline | Every checkable claim is in `facts` with a real source, or is marked `[VERIFY]` and kept off screen. No number without a fact. | An unsourced statistic, date or quote; a `verified` fact with no source; a claim stronger than its source. |
| 5 | Written for the ear | Short sentences, concrete nouns, active verbs; reads aloud at 2.3-2.8 words per second without a stumble. | Long written-style sentences, stacked clauses, or a pace over 3 words per second. |
| 6 | On-screen text | Each `on_screen_text` is 2-6 words, adds to the narration, and is the phrase worth a screenshot. | It repeats the narration, runs long, or is missing where the scene needs an anchor. |
| 7 | Visual intent | Each scene says what the viewer should understand from the picture, in castable terms. | Camera or style jargon, abstractions with nothing to show, or the same picture in every scene. |
| 8 | Voice | Sounds like one specific person; no stock phrases; rhythm varies; humour or weight fits the tone in the brief. | Generic explainer voice, or any text tell from `rubrics/ai-tells.md`. |
| 9 | Length and pacing | Total is within 10% of `target_seconds`; scene lengths follow information load; the platform's pace is respected. | Padding, a rushed payoff, or scenes of equal length regardless of content. |
| 10 | Ending | The close lands the idea in a line that would not fit another video; on loop platforms it hands back to the hook. | It summarises, asks for likes, or trails off. |

## How to check
- Parameter 2: write the one-sentence summary yourself before scoring. If you need "and", score 7 or lower.
- Parameter 4: open the `facts` arrays. For each number or name in the narration, find its fact. Check
  that each `source` is specific. You are not asked to browse; score what is recorded.
- Parameter 5: read every `narration` aloud in your head at speaking pace and count words per second
  for the densest scene.
- Parameter 8: search for the text tells listed in `rubrics/ai-tells.md` and name each one found.
- Evidence always cites a scene id (`s2`).
