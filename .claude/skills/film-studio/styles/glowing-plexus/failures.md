# glowing-plexus failures

What goes wrong in this style, what it looks like, and the fix. Read before building a network.

| # | Failure | What you see | Fix |
|---|---|---|---|
| 1 | `Math.random` for positions | The web jumps every frame; two renders differ | One `mulberry32` seeded from `fnv1a(seed)`, used only at build time |
| 2 | A random number drawn inside a frame | Nodes shimmer or packets jitter | Motion is a closed form of the frame: sines with seeded phases |
| 3 | Network built inside the component body | Rebuilt per render; slow, and any order change reseeds it | Build once as a module constant |
| 4 | Links recomputed with a hard cutoff | Lines pop on and off at full strength | Alpha `0.5 * (1 - d / limit) ^ 1.6`, zero at the limit |
| 5 | Every pair linked | A grey hairball | Link only under the limit (0.75, 1.6 times for hubs) |
| 6 | All nodes the same size | No hubs; nothing to look at | Size and halo from degree, `(deg / max) ^ 0.8` |
| 7 | Labelled hub not the biggest light | The eye lands on a random node | Hub reach 1.6, 11 px core, 6 times halo, `ink` centre |
| 8 | Normal compositing | Overlaps look muddy, glows stack as grey | `globalCompositeOperation = 'lighter'` after painting `bg` |
| 9 | Too high a link alpha with additive light | Dense clusters blow out to white | Max alpha 0.5, halo at 0.18 of the core |
| 10 | Packets interpolated between unlinked nodes | Light flies across empty space | Packets only on shortest path tree links |
| 11 | Child lights before its parent | Cause and effect read backwards | Arrival frames from Dijkstra; a node lights when its packet lands |
| 12 | Clusters fill from each other | Hub 2 lights before its bridge lands | Propagate inside each cluster from its own hub; spill only to leftovers |
| 13 | Bridge timing off by a few frames | The hub fires before or after the packet arrives | Bridge departs at fire minus 24 and takes 24 frames |
| 14 | No tail on the packet | A dot that is hard to follow | A tail 0.35 of the link, fading to transparent |
| 15 | Camera eases to a stop | The film dies at the end | Constant forward drift, 0.008 a frame, never eased |
| 16 | Drift too fast | Hubs fly out of frame; leaders swing | 0.008 a frame: about 17 percent closer over 6 s |
| 17 | Static web | Looks like a still image | Every node bobs 0.05 units on its own sines |
| 18 | Off-focus points kept sharp | No depth; RackFocus does nothing | Circle of confusion 6 px a unit, alpha `(r / (r + coc)) ^ 2` |
| 19 | Defocus without dimming | Big blurred discs blow out | Keep total light: dim as the disc grows, floor 0.15 |
| 20 | Hub zoom on a stiff spring | A snap, not elastic | Spring 6/170/0.6: one overshoot, settled by 20 frames |
| 21 | Text set on the web | Links and packets run through letters | Opaque `surface` plate with a 28 px `bg` scrim |
| 22 | Title over the web | Lines cross the headline | A `bg` fade over the top 24 percent |
| 23 | Wide display face on a long line | The title clips at the right edge (Syne 800) | 7 characters a line or fewer |
| 24 | Readout label in a derived colour | `check-design.js` palette lock fails on focused palettes | Labels in `dim` when the palette has it, else `primary` |
| 25 | Hub too near the frame edge | Its cluster is cut off | Hubs inside x -0.85 to 1.15 at depth 10 |
| 26 | Plate on top of its hub | The label hides what it names | Plate beside the hub; leader to the orbit ring |
| 27 | Empty bottom of the frame | A dead black band under the readouts | Field runs to y -3.2 so faint web and dust fill it |
| 28 | Live number changes length | Plates jump as they tick | Fixed-length strings, `tabular-nums` |
| 29 | Light `bg` | The glow disappears | Every palette `bg` is near black |
| 30 | Palette hex in a component | Palette lock fails | Role names from `design-system.json` |

## Quick self-check before handing off
1. Run `node scripts/check-design.js --systems glowing-plexus`, then `check-design.js` and `check-safezones.js` on the film.
2. Render one frame twice. Are the PNGs identical?
3. Render a spread frame, a bridge frame and the last frame. Do packets ride links, and do hubs read as the biggest lights?
4. Can every plate be read with links and packets behind it?
