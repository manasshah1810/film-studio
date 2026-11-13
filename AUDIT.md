# AUDIT (pass 1, before any change)

Date: 2026-11-13. Scores are 1-10 against the goal "plain prompt = 4/10, this skill = 8/10".
One line of evidence per file. Independent re-score of a random third is in
section 4; where the two disagree the LOWER score is the one that counts.

## 1. Verified against current docs

| Claim | Result | Source |
|---|---|---|
| Remotion version in kit | 4.0.543 installed, `npx remotion still` renders (40 s cold) | local run |
| `@remotion/google-fonts` | `loadFont(style, {weights, subsets})`; blocks render until ready; weights + subsets mandatory from v5, optional in 4.x. Package was NOT installed (now is) | remotion.dev/docs/google-fonts/load-font |
| Remotion agent skill | `npx skills add remotion-dev/skills` (skill `remotion-best-practices`) | third-party directories agree; official repo not opened [CHECK] |
| Hyperframes | Real: HeyGen open-source HTML-to-video framework, Apache-2.0, CLI `init / preview / render`, headless Chrome + FFmpeg, Node 22+. It consumes HTML, not our JSON, so it stays an OPTIONAL adapter | heygen.com/research/html-to-video; exact CLI flags [CHECK] |
| Claude Code skills | `.claude/skills/<name>/SKILL.md`, YAML frontmatter `name`, `description` (+ `allowed-tools` etc.) | third-party summaries of code.claude.com/docs/en/skills [CHECK exact field list] |
| Subagents | `.claude/agents/*.md` with `name`, `description`, `tools`, `model` | same [CHECK] |
| `@remotion/three` | installed 4.0.543 with three 0.187 / R3F 9.8.2; `<ThreeCanvas>` not yet rendered here | local; still test pending [CHECK] |
| Platform safe zones, hook windows | all third-party numbers, none from platform specs | stays [CHECK] |

## 2. File scores

### Root and agents
| File | Score | Evidence |
|---|---|---|
| CLAUDE.md | 7 | Clear 10 rules; rule 2 forbids all stills, no mention of design systems, points to an unbuilt `ledger.js` |
| agents/producer.md | 7 | Evidence-per-score and anti-inflation rules are good; reads a `platforms/` path that does not exist (`library/platforms/`) |
| agents/director-review.md | 7 | Same strengths; cannot see stills (tools Read only is fine) but has no design-system check because none exists |
| agents/ai-checker.md | 7 | Computed detection, owner routing; formula hard-codes 56 and 28 tells, judges plans only, never a still |

### SKILL.md
| File | Score | Evidence |
|---|---|---|
| SKILL.md | 0 | MISSING. The skill cannot be invoked; there is no Director, no interview, no pipeline entry point |

### Roles
| File | Score | Evidence |
|---|---|---|
| roles/writer.md | 8 | Chain test ("remove one scene and the story breaks"), fact rules, word-rate limits are specific |
| roles/selector.md | 6 | Reuse rules good; scorecard scheme is self-declared broken ("[CHECK: protocol names files per stage]"), two files per asset per round is bloat |
| roles/talent-acquisition.md | 6 | Style-lock idea right, but definitions are free-form with no schema and reference kit primitives that cannot consume them |
| roles/storyboard.md | 6 | Good variety and duration rules; `framing/camera/action` strings cannot drive a renderer, so "JSON-driven composition" is impossible |
| roles/vfx-director.md | 7 | Energy curve, 30% cap, merge depth are concrete; effects have no components to run |
| roles/treasurer.md | 6 | Sound policy; every command it names (`ledger.js`) is unbuilt |
| roles/renderer.md | 5 | Right gates, but 4 [CHECK: unbuilt] items; nothing it describes can execute |
| roles/voice.md | 5 | Key hygiene is right; `providers/voice/` is empty, no free local option exists |
| roles/stock-sourcer.md | 6 | Licence discipline good; `credits.js` unbuilt, no decision field for trademarks |

### Rubrics
| File | Score | Evidence |
|---|---|---|
| rubrics/review-protocol.md | 8 | Tight, anti-gaming section is real |
| rubrics/script.md | 8 | Auto-fails + anchored worked example |
| rubrics/storyboard.md | 7 | Counted auto-fails; no parameter for composition craft or design-system compliance |
| rubrics/vfx.md | 7 | Hard fails are computed; fine |
| rubrics/cast.md | 7 | Low-res scoring caps are thoughtful; no design-system compliance |
| rubrics/ai-tells.md | 7 | 28 tells with detect tests; all plan-level, none for the rendered look (gradients, default fonts, centered cards) that actually reads as AI |

### Schemas and scripts
| File | Score | Evidence |
|---|---|---|
| schema/*.schema.json (10) | 5 | Valid but thin: no design choice in brief, storyboard panels are prose, cast has no definition schema, state has no round data |
| schema/example.*.json (10) | 4 | Brief uses a style that does not exist (`documentary-explainer`); vfx example uses ids not in the library (`fade-in`, `split-wipe`); 3-scene 15/25/15 script is itself the 4/10 baseline |
| scripts/validate.js | 6 | Works for schema + 3 semantic checks; `libraryEffects()` compares effect ids to FILE names, so every real effect id fails |
| scripts/ledger.js, credits.js, check-render.js, check-design.js | 0 | MISSING, referenced by 5 role files |

### Library
| File | Score | Evidence |
|---|---|---|
| library/vfx/*.json (7 files, 66 entries) | 7 | Entries are genuinely documented (what / when / when not / styles / cost / mergeable); zero matching components exist |
| library/vfx/merge-recipes.md | 6 | 123 lines (over limit), says merges are planned in `storyboard.json` (wrong file) |
| library/costs.json | 6 | Sensible structure; buckets (`short/standard/...`) do not match brief buckets (`15-30s/...`) |
| library/platforms/*.md (5) | 6 | Usable shape; 47 [CHECK] marks, near-duplicate text between instagram and tiktok |

### Styles (the weak layer)
| File | Score | Evidence |
|---|---|---|
| styles/index.md | 5 | Table fine; contains two open "[CHECK] paste the list" notes |
| styles/whiteboard.md | 4 | A definition, not art direction: "marker lines on a white board". One 4-ink palette, 2 font names, "width 4-8 px" |
| styles/hand-drawn.md | 4 | 0 hex codes in the file |
| styles/data-infographic.md | 4 | 0 hex codes; "clean layout" |
| styles/kinetic-typography.md | 4 | 3 hex codes, falls back to Inter |
| styles/comic-manga.md | 4 | 1 hex code; Comic Sans in the kit |
| styles/pixel-art.md | 5 | Names real palettes (gb4, pico8) but those are other people's palettes, not an identity |
| styles/2d-cartoon.md | 4 | Output is the generic sky-blue / grass-green / sun cartoon |
| styles/watercolor.md | 3 | 0 hex codes, no kit |
| styles/stop-motion.md | 3 | No kit |
| styles/3d-threejs.md | 4 | 10 [CHECK]; kit exists, look is default three.js |
| styles/cinematic-graded.md | 3 | Depends on stock footage it cannot guarantee; no kit |
| styles/photorealistic-stock.md | 4 | Placeholder gradient when no asset; licence flow fine |
| All 12: design-system.json, recipes.md, failures.md, rubric | 0 | MISSING |

### Components
| File | Score | Evidence |
|---|---|---|
| components/package.json, tsconfig, entry.ts | 7 | Pinned versions, works |
| components/Root.tsx | 5 | Only Preview grids; no film composition |
| components/shared/*.ts(x) (6) | 6 | `useBox` relative units and `RigFigure` are reusable; `TextOverPhoto` hard-codes Inter + black gradient |
| components/styles/whiteboard/* | 5 | One-progress stroke+hand is a real idea; still looks like a demo grid of 5 icons |
| components/styles/2d-cartoon/* | 3 | Preview is the stock "kid cartoon" look (see .preview/2d-cartoon.png) |
| components/styles/comic-manga/* | 4 | Halftone and speed lines work; character is a stick doll, font is Comic Sans |
| components/styles/hand-drawn/* | 4 | Boil filter exists; system cursive font |
| components/styles/data-infographic/* | 5 | Real scales/ticks code; default look |
| components/styles/kinetic-typography/* | 5 | Fit-text and palette check exist; Inter |
| components/styles/3d-threejs/* | 4 | Untested with ThreeCanvas stills |
| components/styles/photorealistic-stock/* | 4 | Placeholder only |
| components/styles/{pixel-art,watercolor,stop-motion,cinematic-graded}/ | 0 | MISSING |
| components/effects/ | 0 | EMPTY: 66 documented effects, 0 components |
| providers/voice/ | 0 | EMPTY |

## 3. What is missing
1. SKILL.md (the product entry point) and the Director role.
2. Any closed design system: no palettes, pairings, motion curves or forbidden lists as data.
3. A film composition driven by JSON. Today nothing turns a storyboard into frames.
4. Renderable panel vocabulary: storyboard panels are prose.
5. 66 effect components.
6. Scripts: ledger, credits, check-render, check-design, still/draft render, static check.
7. 4 style kits; recipes, failures and rubrics for all 12 styles.
8. Voice adapters (paid, free local, captions-only).
9. Baseline to beat, and any measured comparison.
10. README, install line, DECISIONS, resume logic that is actually executable.
11. Fonts: nothing loads a real font; every kit falls back to system fonts.

## 4. Independent re-score (random third)
22 files re-scored by a fresh subagent. Final = the lower of the two.

| File | Mine | Independent | Final | Independent's evidence |
|---|---|---|---|---|
| agents/ai-checker.md | 7 | 6 | 6 | Divides by 56 while applying only one stage's tells, so a fully tell-ridden script maxes at 38 ("minor") |
| roles/storyboard.md | 6 | 5 | 5 | Read list excludes the style file; two unresolved [CHECK] contradictions |
| roles/renderer.md | 5 | 3 | 3 | Depends on scripts that do not exist; no composition consumes the plan |
| roles/treasurer.md | 6 | 3 | 3 | Every action goes through a missing `ledger.js` |
| rubrics/ai-tells.md | 7 | 6 | 6 | Visual tells keyword-match free text against a schema with no composition fields |
| rubrics/cast.md | 7 | 6 | 6 | "Style's reference" does not exist; assumes PNGs while cast is JSON |
| schema/storyboard.schema.json | 5 | 4 | 4 | Free strings, no enums, nothing art-directed can be encoded |
| schema/example.vfx-plan.json | 4 | 2 | 2 | Fails the skill's own validator; reasons are tell E3 |
| scripts/validate.js | 6 | 5 | 5 | Effect ids checked against file names; ajv resolves only from `components/` |
| library/costs.json | 6 | 4 | 4 | Buckets do not match brief buckets; cut order names a field the schema lacks |
| library/platforms/youtube.md | 6 | 6 | 6 | Standard advice, all [CHECK] |
| library/vfx/transitions.json | 7 | 6 | 6 | Best-written content, but no components; `mergeable_with` cites ids in no file |
| library/vfx/merge-recipes.md | 6 | 5 | 5 | Worked merges use missing effects; wrong owner file |
| styles/hand-drawn.md | 4 | 6 | 4 | (mine lower) recommends uninstalled packages |
| styles/watercolor.md | 3 | 4 | 3 | (mine lower) no kit, yet offered |
| styles/comic-manga.md | 4 | 7 | 4 | (mine lower) its own tells describe the kit output |
| styles/3d-threejs.md | 4 | 5 | 4 | (mine lower) relies on uninstalled drei / postprocessing |
| components/shared/rig.tsx | 6 | 7 | 6 | (mine lower) rotation-only poses read stiff |
| components/styles/comic-manga/primitives.tsx | 4 | 6 | 4 | (mine lower) fonts never loaded; fitText measures the wrong font |
| components/styles/data-infographic/primitives.tsx | 5 | 6 | 5 | (mine lower) default dark dashboard |
| components/styles/kinetic-typography/primitives.tsx | 5 | 6 | 5 | (mine lower) "RISING" clipped by its own mask |
| components/Root.tsx | 5 | 4 | 4 | Only 8 preview grids; 4 styles absent |

Its three cross-file findings, all accepted: (1) no path from plan to pixels;
(2) the layers contradict each other (validator, examples, buckets, effect
ownership); (3) what renders is competent but generic and fonts never load.
New defects it found that pass 1 missed: `mergeable_with` cites `motion-blur`
and `soft-shadow` (in no library file); AI-feel maths deflates per-stage scores.

## 5. Verdict
Process documents (roles, rubrics) average about 6.5: careful, but they describe a
machine that does not exist. The visual layer averages about 3.5 and is the
reason output would look like the 4/10 baseline. Rebuild order: design systems
and kits first, then the JSON film composition, then scripts, then trim the docs
to match what really runs.
