import React from 'react';
import {interpolate} from 'remotion';
import {mix} from '../../engine/tokens';
import {boxPx, boxStyle, enterP, txt} from '../social/tokens';
import {Card, Label, numCss} from './parts';
import {fmt, type DataBase, lab} from './tokens';

/**
 * 26 RunningList. A ranked list whose tallies run: each row's value moves through its keyframes, bars track the value and
 * rows slide to their new rank as they overtake. Rank is a smooth function of the values, so an overtake is a slide.
 */
export type RunRow = {label: string; values: number[]};
export type RunningListProps = DataBase & {title: string; unit?: string; rows: RunRow[]; periods: [string, string]; runAt?: number; runFrames?: number; dec?: number; seed: string};
export const RUNNING_LIST = {frames: 120, hero: 116, sfx: [{at: 'runAt', id: 'digital-tick'}, {at: 'each overtake', id: 'click-soft'}]};

const sstep = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

export const RunningList: React.FC<RunningListProps> = ({tk, frame: f, box, title, unit = '', rows, periods, runAt = 16, runFrames = 84, dec = 0}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const pad = 52;
	const head = 150;
	const n = rows.length;
	const rowH = Math.min(118, (H - head - pad - 90) / n);
	const t = interpolate(f, [runAt, runAt + runFrames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: tk.move});
	const val = (r: RunRow) => {
		const k = r.values.length - 1;
		const x = t * k;
		const i = Math.min(k - 1, Math.floor(x));
		return k === 0 ? r.values[0] : r.values[i] + (r.values[i + 1] - r.values[i]) * (x - i);
	};
	const v = rows.map(val);
	const max = Math.max(...rows.flatMap((r) => r.values));
	const span = max * 0.04;
	const rank = v.map((a, i) => v.reduce((s, b, j) => (j === i ? s : s + sstep((b - a) / span + 0.5)), 0));
	const lead = rank.indexOf(Math.min(...rank));
	const numW = 0.62 * tk.size.body * (fmt(max, dec).length + unit.length + 1);
	const barX = 64;
	const barW = W - pad * 2 - barX - numW - 24;
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', flexDirection: 'column', gap: 10}}>
					<Label tk={tk}>{title}</Label>
					<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
						<span style={{...numCss(tk, tk.size.h2, tk.text)}}>{t >= 1 ? periods[1] : t > 0 ? `${periods[0]}–${periods[1]}` : periods[0]}</span>
						<Label tk={tk} color={tk.accent}>{t >= 1 ? 'FINAL' : t > 0 ? 'RUNNING' : ''}</Label>
					</div>
				</div>
				<div style={{position: 'absolute', left: pad, right: pad, top: head + 20, height: rowH * n}}>
					{rows.map((r, i) => {
						const y = rank[i] * rowH;
						const on = i === lead;
						const pop = enterP(tk, f, 4 + i * tk.stagger, tk.enterFrames);
						const fill = on ? tk.series[0] : mix(tk.c.surface, tk.series[0], 0.34);
						return (
							<div key={r.label} style={{position: 'absolute', left: 0, right: 0, top: y, height: rowH - 16, display: 'flex', alignItems: 'center', opacity: pop, transform: `translateX(${(1 - pop) * -30}px)`, zIndex: on ? 2 : 1}}>
								<span style={{...numCss(tk, tk.size.label, on ? tk.text : tk.label), width: barX, flex: 'none'}}>{String(Math.round(rank[i]) + 1).padStart(2, '0')}</span>
								<div style={{position: 'relative', width: barW, height: rowH - 16, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10}}>
									<span style={{...txt(tk, 'body', lab(tk, 0.92), on ? tk.text : tk.label)}}>{r.label}</span>
									<div style={{position: 'relative', height: Math.max(10, tk.stroke.line * 1.6), background: tk.well, borderRadius: 99}}>
										<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: Math.max(8, (v[i] / max) * barW), background: fill, borderRadius: 99, filter: on ? tk.glow(tk.series[0]) : 'none'}} />
									</div>
								</div>
								<span style={{...numCss(tk, tk.size.body, on ? tk.text : tk.label), width: numW, marginLeft: 24, textAlign: 'right', flex: 'none'}}>{`${fmt(v[i], dec)}${unit}`}</span>
							</div>
						);
					})}
				</div>
			</Card>
		</div>
	);
};
