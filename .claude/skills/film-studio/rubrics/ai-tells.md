# AI tells

28 signs that make a video look machine-made. The AI Checker scores each one from 1 to 10
(10 = no trace, 7 = present once and minor, 4 = obvious, 1 = everywhere) with a scene or panel id as
evidence. Any tell under 7 goes back to the stage named in the last column, once.
Scorecard: `stage: "aicheck"`, `rubric: "rubrics/ai-tells.md"`, 28 params in this order.

## Text (read `work/script.json` and every slot in `work/storyboard.json`)
| # | Tell | What it looks like | Back to |
|---|---|---|---|
| 1 | Announcing opener | "In this video", "Let's dive in", "Ever wondered", "Picture this", a greeting | script |
| 2 | Stock vocabulary | delve, tapestry, landscape, realm, journey, game-changer, unlock, elevate, seamless, robust | script |
| 3 | Not X but Y | "It's not just A, it's B", "This isn't about A. It's about B." used for false depth | script |
| 4 | Rule of three by habit | Lists of exactly three adjectives or clauses where two or four would be true | script |
| 5 | Empty intensifiers | truly, incredibly, absolutely, literally, really, very, "one thing is clear" | script |
| 6 | Hedge stacking | "can often sometimes", "may potentially", or a claim softened until it says nothing | script |
| 7 | Rhetorical question chain | Two or more questions in a row, or a question answered at once with "The answer?" | script |
| 8 | Summary close | "In conclusion", "So next time", "The takeaway", a moral, or a call to like and subscribe | script |
| 9 | Uniform rhythm | Every sentence the same length; every scene the same shape; colon-reveal headlines throughout | script |
| 10 | Invented specifics | A statistic, date, quote, study or expert with no fact entry behind it | script |
| 11 | Title-case slogans | On-screen text that reads like an ad headline ("Unlock Your Potential") instead of the script's words | storyboard |
| 12 | Generic nouns | "technology", "innovation", "the future", "success" where the topic has a concrete word | script |
| 13 | Symmetry of opinion | "Some say A, others say B" with no position taken, where the brief asked for a point of view | script |
| 14 | Caption echo | Captions or headlines that repeat the narration word for word on every panel | storyboard |

## Picture (look at the proof sheet in `work/stills/`; read `work/storyboard.json` and `work/vfx-plan.json`)
| # | Tell | What it looks like | Back to |
|---|---|---|---|
| 15 | Centred everything | Every panel a centred stack: kicker, headline, sub, in the middle of the frame | storyboard |
| 16 | Same layout repeated | One layout for most panels, usually `title`; no change of scale or focal point | storyboard |
| 17 | Style-less default | The frame could belong to any template: fewer than three of the style's five signature moves visible across the sheet | storyboard |
| 18 | Decoration without meaning | Shapes, icons, particles or effects that point at nothing in the script | vfx |
| 19 | Effect on everything | Most panels carry an effect; the same transition on every cut | vfx |
| 20 | Purple-gradient look | Glows, glassy cards and gradient backgrounds in a style whose rules forbid them | vfx |
| 21 | Emoji or clip-art stand-ins | A generic icon where the script needed a specific object or person | cast |
| 22 | Interchangeable characters | Figures that differ only in colour; nobody has a role you can read | cast |
| 23 | Dead acting | Idle poses and neutral faces on lines that carry emotion | storyboard |
| 24 | Text wall | More than about 12 words to read on one panel, or body text under 4% of the short side | storyboard |
| 25 | Even pacing | All panels within half a second of the same length regardless of content | storyboard |
| 26 | Unlabelled or decorative data | A chart or number with no label, unit or source in the script; fake precision | storyboard |
| 27 | Borrowed look | Anything recognisable from a real brand, film, game, comic or person | cast |
| 28 | Broken frame | Clipped or overlapping text, content under the platform's interface zones, an empty panel | storyboard |

## How to score
- Go through all 28 in order; do not stop at the first failures.
- Evidence for a score under 9: quote the words (text tells) or name the panel id (picture tells).
- Count before you judge: tells 4, 9, 15, 16, 19 and 25 are about patterns across the film.
- Tell 10 and tell 27 are never minor: if present at all, score 4 or lower.
- A film can use a word from tell 2 honestly ("the journey took 40 days"). Score the habit, not the word.
- `average`, `minimum` and `passed` follow the usual gate; `feedback` lists the stages to revisit.
