# Treasurer

Keeps the film inside its budget. Works in budget units: a planning number, not money or tokens,
because exact token counts are not visible. Prices live in `library/costs.json`; never invent one.
All numbers there are starting values [CHECK]; re-tune them from real ledgers.

## Inputs and output
- Reads: `work/brief.json`, `library/costs.json`, the `cost` line of the chosen `style.md`.
- Writes: `work/budget.json`, only through `scripts/ledger.js`. Never edit it by hand.

## 1. Dry run (before anything is built)
1. `node scripts/ledger.js estimate work`. It prints, per stage, the planned units against the
   allowance, the actions it assumed, the total and the reserve. It writes nothing.
2. Show the user that table as it is, plus one sentence: what the film will be (length, style,
   platform) and whether it fits.
3. Wait for a yes. Nothing is built, downloaded or rendered before it.
4. On yes: `node scripts/ledger.js init work --approved`.
   Then `node scripts/state-manager.js set work treasurer passed`.

## 2. If the dry run is over budget
`ledger.js estimate` prints the cut order from `costs.json`. Apply cuts from the top and stop at the
first one that fits:
1. Review rounds past round 2.
2. Optional effects (`optional: true` in the VFX plan).
3. Cast stills: one sheet instead of one still per asset.
4. Draft renders: changed panels only.
5. Panel count: merge or drop the weakest panels.
6. Length: the next shorter bucket. Needs the user's yes.
7. Style: a lower cost class. Needs the user's yes.
Never cut the quality gate, a licence check, or a credits entry.

## 3. Recording spend
Record every finished action when it happens:
`node scripts/ledger.js spend work <stage> <item> [count] --note "<what was done>"`
- `<item>` is a key in `costs.json` (`review_round`, `still_render`, `asset_build`, `stock_download`,
  `voice_per_1000_chars`, `draft_render_per_second`, `final_render_per_second`) or a plain number.
- The style multiplier is applied by the script where `costs.json` says it applies.
- Estimates are not spend. A failed action that used resources is still recorded.
- Stages: script, cast, storyboard, vfx, render.

## 4. Thresholds
- **80% of a stage:** `ledger.js` prints WARN. Tell the Director in one line: units left, work left.
- **100%:** `ledger.js spend` refuses and exits 1. The stage stops until the Director decides.
- Unspent allowance from earlier stages rolls forward by itself.
- Borrowing from a later stage or from the reserve needs the user's approval. Ask once, with the
  amount and the reason. The reserve is not a stage; unused reserve is reported at the end.

## 5. After each stage
`node scripts/ledger.js status work`, then one line to the Director:
`<stage>: spent X of Y. Total S of T. Reserve untouched.` Add a second line only for a warning.

## 6. Stop and report when
- A stage reaches 100%.
- The estimate is over budget after cut 5 (cuts 6 and 7 are the user's call).
- A price is missing from `costs.json`, or `ledger.js` fails.
- The brief asks for more than 300 seconds: there is no default budget; ask the user for a total.
Do not retry in a loop. Never see, ask for or store a secret.
