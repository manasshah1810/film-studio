# Cast rubric

For `work/cast.json` and its proof sheet `work/stills/cast-sheet.png`. Reviewers also read
`work/needs.json`, `work/brief.json` and the Forbidden list of the film's `style.md`.
Protocol and gate: `rubrics/review-protocol.md`.

| # | Parameter | 9-10 looks like | 6 or below when |
|---|---|---|---|
| 1 | Coverage | Every need has exactly one asset; nothing is cast that no scene uses. | A need is missing, duplicated, or an asset has no scene. |
| 2 | Tell-apart test | Every character is recognisable from silhouette and colour at thumbnail size. | Two characters differ only in one small detail. |
| 3 | Role legibility | Each definition says who the character is in the story (leader, rival, learner) through colour and one accessory. | Arbitrary choices; the lead does not read as the lead. |
| 4 | Prop readability | Each prop reads as its object on the sheet with no label. | A prop needs explaining, or two props look alike. |
| 5 | Style fit | Every asset looks native to the film's style on the sheet; nothing breaks the style's Forbidden list. | Custom shapes too detailed, too thin or too many-coloured for the style. |
| 6 | Palette roles | Colours are palette roles used with meaning: primary for the lead, secondary for contrast, three roles or fewer per prop. | Roles scattered with no logic, or a character in a role the style reserves for text or light. |
| 7 | Economy | The smallest cast that tells the story; built-in props used wherever they fit. | Custom builds where a built-in base would do; extras that never matter. |
| 8 | Originality and rights | No logo, real person, existing character or product design. Sourced media has a credits entry. | Anything recognisable from a real brand, film or game, or media with no licence. |
| 9 | Emotional range | The cast can act the script: poses and expressions the scenes need are available to these definitions in this style. | A faceless style is asked to carry a scene on facial expression. |
| 10 | Notes and traceability | Each asset has a `need_id` and a one-line note that matches what is on the sheet. | Notes missing, or describing something the sheet does not show. |

## How to check
- Open the sheet first, before the JSON. Write down what each figure and object seems to be. Then
  compare with `needs.json`: a mismatch is evidence for parameters 3 or 4.
- Parameter 2: squint, or imagine the sheet at a quarter of its size.
- Parameter 5: read the style's Forbidden list and look for each item on the sheet.
- Parameter 8: if anything reminds you of a specific brand or character, score 6 or lower and name it.
- Evidence always cites an asset id.
