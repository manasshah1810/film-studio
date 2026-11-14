import React from 'react';
import {random} from 'remotion';
import {boxPx, boxStyle, card, enterP, txt} from '../social/tokens';
import {TAB, lab} from '../data/tokens';
import {slamP, whipP} from '../camera/tokens';
import {Card, Label, Scene, SPOT, frameOf} from './parts';
import type {LayerFx, LayerId} from '../camera/parts';
import type {KineticBase} from './tokens';

/**
 * 50 StoryboardDeck. A film of 3 to 6 scenes as storyboard cards. Cards wait in a deck below the card edge and are
 * dealt one every `dealGap` frames: each flies to its slot in a two-column grid on the whip easing, turning from
 * 18 degrees to a small seeded rest angle, and lands on the slam spring. Each card is the style's card with a scene
 * number on its margin, a thumbnail of the code-drawn shot (wide, close, night, detail) and a one-line caption.
 * The deck counter reads the cards left.
 */
export type StoryboardDeckProps = KineticBase & {label: string; scenes: string[]; dealAt?: number; dealGap?: number; seed: string};
export const STORYBOARD_DECK = {frames: 96, hero: 90, sfx: [{at: 'each deal', id: 'card-flick'}, {at: 'last landing', id: 'click-soft'}]};

type Shot = {night?: boolean; zoom?: number; origin?: [number, number]};
const SHOTS: Shot[] = [{}, {zoom: 2.1, origin: [SPOT.subject.x, 0.68]}, {night: true}, {zoom: 3, origin: [0.735, 0.4]}, {zoom: 1.35, origin: [0.5, 0.6]}, {night: true, zoom: 2.1, origin: [SPOT.subject.x, 0.68]}];

export const StoryboardDeck: React.FC<StoryboardDeckProps> = ({tk, frame: f, box, label, scenes, dealAt = 8, dealGap = 10, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const {pad, head} = frameOf(tk);
	const list = scenes.slice(0, 6);
	const n = Math.max(3, list.length);
	const vw = W - pad * 2, vh = H - head - pad;
	const G = 24;
	const cols = 2, rowsN = Math.ceil(n / cols);
	const cw = (vw - G) / cols;
	const ch = (vh - G * (rowsN - 1)) / rowsN;
	const ip = 14;
	const numH = lab(tk, 0.72) * 1.5;
	const capH = tk.size.body * 0.72 * 1.4;
	const thW = cw - ip * 2, thH = Math.max(60, ch - ip * 2 - numH - capH - 16);
	const dealt = list.filter((_, i) => f >= dealAt + i * dealGap).length;
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between', zIndex: 20}}>
					<Label tk={tk}>{label}</Label>
					<Label tk={tk} color={dealt === list.length ? tk.accent : tk.label} style={TAB}>{`DECK ${String(list.length - dealt).padStart(2, '0')} LEFT`}</Label>
				</div>
				{list.map((cap, i) => {
					const st = dealAt + i * dealGap;
					const p = whipP(tk, f, st, 12);
					const land = slamP(tk, f, st + 12);
					const sx = pad + (i % cols) * (cw + G), sy = head + Math.floor(i / cols) * (ch + G);
					const fx0 = W - cw * 0.7, fy0 = H + 40 + i * 6;
					const x = fx0 + (sx - fx0) * p, y = fy0 + (sy - fy0) * p - Math.sin(p * Math.PI) * 80;
					const rest = (random(`${seed}-a${i}`) - 0.5) * 5;
					const rot = 18 + (rest - 18) * p;
					const sc = p >= 1 ? 1 + 0.06 * (1 - land) : 1.04;
					const shot = SHOTS[i % SHOTS.length];
					const z = shot.zoom ?? 1;
					const fxAll: Partial<Record<LayerId, LayerFx>> = z === 1 ? {} : Object.fromEntries((['sky', 'far', 'mid', 'subject', 'near'] as LayerId[]).map((l) => [l, {scale: z}]));
					return (
						<div key={i} style={{position: 'absolute', left: x, top: y, width: cw, height: ch, ...card(tk, 'surface', Math.min(tk.radius, 18), 0.6), background: tk.c.surface, transform: `rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(4)})`, zIndex: 10 + i, boxShadow: `${card(tk, 'surface').boxShadow === 'none' ? `0 10px 0 ${tk.grid}` : card(tk, 'surface').boxShadow}, inset 0 0 0 ${tk.stroke.hair}px ${tk.grid}`}}>
							<div style={{position: 'absolute', left: ip, top: ip, height: numH, display: 'flex', alignItems: 'center', gap: 12}}>
								<span style={{...txt(tk, 'mono', lab(tk, 0.72), tk.accent), ...TAB, letterSpacing: '0.1em'}}>{`SC ${String(i + 1).padStart(2, '0')}`}</span>
							</div>
							<div style={{position: 'absolute', left: ip, top: ip + numH + 4, width: thW, height: thH, overflow: 'hidden', borderRadius: Math.min(tk.plateR, 10), background: tk.c.bg}}>
								<Scene tk={tk} w={thW} h={thH} seed={`${seed}-${i}`} night={shot.night} fx={fxAll} origin={shot.origin} span={0.1} />
							</div>
							<div style={{position: 'absolute', left: ip, right: ip, top: ip + numH + thH + 14, height: capH, display: 'flex', alignItems: 'center'}}>
								<span style={{...txt(tk, 'body', tk.size.body * 0.72, tk.text), minWidth: 0}}>{cap}</span>
							</div>
						</div>
					);
				})}
			</Card>
		</div>
	);
};
