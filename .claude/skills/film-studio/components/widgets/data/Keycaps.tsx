import React from 'react';
import {spring} from 'remotion';
import {mix} from '../../engine/tokens';
import {FPS, boxPx, boxStyle, enterP, popP, txt} from '../social/tokens';
import {Card, Label} from './parts';
import {TAB, type DataBase} from './tokens';

/**
 * 30 Keycaps. A shortcut or a typed number as physical keys: caps pop in, then each one presses down in turn on the
 * style's spring (top face drops into its side wall, fills with the series colour) and the result line appears.
 */
export type KeycapsProps = DataBase & {keys: string[]; label: string; result: string; pressAt?: number; each?: number; holdAll?: boolean; seed: string};
export const KEYCAPS = {frames: 90, hero: 72, sfx: [{at: 'pressAt + i * each', id: 'click-soft'}, {at: 'pressAt + n * each + 4', id: 'notification-ping'}]};

export const Keycaps: React.FC<KeycapsProps> = ({tk, frame: f, box, keys, label, result, pressAt = 24, each = 8, holdAll = true}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const pad = 52;
	const gap = 26, plus = 40;
	const unit = Math.min(190, (W - pad * 2 - (keys.length - 1) * (gap * 2 + plus)) / keys.reduce((s, k) => s + (k.length > 2 ? 1.5 : 1), 0));
	const depth = Math.max(12, unit * 0.11);
	const top = (H - unit) / 2 - 10;
	const done = pressAt + keys.length * each;
	const res = enterP(tk, f, done + 4, 12);
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, top: pad}}>
					<Label tk={tk}>{label}</Label>
				</div>
				<div style={{position: 'absolute', left: pad, right: pad, top, height: unit + depth, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap}}>
					{keys.map((k, i) => {
						const w = unit * (k.length > 2 ? 1.5 : 1);
						const pop = popP(tk, f, 4 + i * tk.stagger);
						const at = pressAt + i * each;
						const down = f < at ? 0 : spring({frame: f - at, fps: FPS, config: tk.spring});
						const up = !holdAll && f >= at + each ? spring({frame: f - at - each, fps: FPS, config: tk.spring}) : 0;
						const d = Math.max(0, Math.min(1.1, down - up));
						const lit = d > 0.5;
						const side = mix(tk.c.surface, tk.c.bg, 0.6);
						return (
							<React.Fragment key={`${k}${i}`}>
								{i > 0 && <span style={{...txt(tk, 'mono', tk.size.h2 * 0.8, tk.label), width: plus, textAlign: 'center', lineHeight: `${unit}px`, opacity: pop}}>+</span>}
								<div style={{position: 'relative', width: w, height: unit + depth, transform: `scale(${pop})`, opacity: Math.min(1, pop * 2)}}>
									<div style={{position: 'absolute', left: 0, right: 0, top: depth, height: unit, borderRadius: Math.max(14, tk.plateR), background: side, border: `${tk.stroke.hair}px solid ${tk.grid}`, boxSizing: 'border-box'}} />
									<div
										style={{
											position: 'absolute', left: 0, right: 0, top: depth * d * 0.85, height: unit, boxSizing: 'border-box',
											borderRadius: Math.max(14, tk.plateR),
											background: lit ? tk.series[0] : mix(tk.c.surface, tk.c.ink, 0.1),
											border: `${tk.stroke.hair}px solid ${lit ? tk.series[0] : tk.grid}`,
											boxShadow: `inset 0 ${-Math.max(4, depth * 0.4)}px 0 ${mix(lit ? tk.series[0] : tk.c.surface, tk.c.bg, 0.3)}`,
											filter: lit ? tk.glow(tk.series[0]) : 'none',
											display: 'flex', alignItems: 'center', justifyContent: 'center',
										}}
									>
										<span style={{...txt(tk, 'mono', k.length > 2 ? Math.max(unit * 0.24, tk.labelMin) : unit * 0.42, lit ? tk.onSeries : tk.text), ...TAB, textTransform: 'uppercase'}}>{k}</span>
									</div>
								</div>
							</React.Fragment>
						);
					})}
				</div>
				<div style={{position: 'absolute', left: pad, right: pad, bottom: pad, display: 'flex', justifyContent: 'center', opacity: res, transform: `translateY(${(1 - res) * 16}px)`}}>
					<span style={{...txt(tk, 'body', tk.size.body * 0.9, tk.text), whiteSpace: 'normal', textAlign: 'center'}}>{result}</span>
				</div>
			</Card>
		</div>
	);
};
