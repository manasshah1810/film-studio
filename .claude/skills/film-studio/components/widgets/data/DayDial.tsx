import React from 'react';
import {boxPx, boxStyle, enterP, lin, txt} from '../social/tokens';
import {Card, Label, arc, numCss, polar} from './parts';
import {TAB, drawP, hhmm, lockP, type DataBase, lab} from './tokens';

/** 22 DayDial. A 24-hour dial: a hand sweeps from `from` to `to`, the arc between fills, the clock readout counts along. */
export type DayDialProps = DataBase & {from: number; to: number; label: string; caption: string; sweepAt?: number; seed: string};
export const DAY_DIAL = {frames: 90, hero: 84, sfx: [{at: 'sweepAt', id: 'pen-scratch'}, {at: 'sweepAt + 48', id: 'click-soft'}]};

export const DayDial: React.FC<DayDialProps> = ({tk, frame: f, box, from, to, label, caption, sweepAt = 18}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const pad = 56;
	const top = 150;
	const R = Math.min((W - pad * 2) / 2 - 64, (H - top - 200) / 2);
	const cx = W / 2, cy = top + R + 56;
	const span = ((to - from + 24) % 24) || 24;
	const p = drawP(tk, f, sweepAt, 48);
	const now = from + span * p;
	const a0 = (from / 24) * 360, a = a0 + (span / 24) * 360 * p;
	const tick = lin(f, 4, 22);
	const settle = lockP(tk, f, sweepAt + 48);
	const hrs = Math.floor(span * p + 1e-6), mins = Math.round((span * p - hrs) * 60) % 60;
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, top: pad, right: pad, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
					<Label tk={tk}>{label}</Label>
					<Label tk={tk} color={tk.text}>24 H</Label>
				</div>
				<svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					<circle cx={cx} cy={cy} r={R} fill="none" stroke={tk.grid} strokeWidth={tk.stroke.line} />
					{Array.from({length: 96}, (_, i) => {
						const major = i % 24 === 0, hour = i % 4 === 0;
						const ang = (i / 96) * 360;
						const [x0, y0] = polar(cx, cy, R - 22, ang);
						const [x1, y1] = polar(cx, cy, R - 22 - (major ? 30 : hour ? 16 : 7), ang);
						return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={major ? tk.text : tk.grid} strokeWidth={major ? tk.stroke.hair * 1.5 : tk.stroke.hair} opacity={lin(tick, i / 120, i / 120 + 0.2)} />;
					})}
					<g style={{filter: tk.glow(tk.series[0])}}>
						{p > 0 && <path d={arc(cx, cy, R, a0, a)} fill="none" stroke={tk.series[0]} strokeWidth={tk.stroke.heavy * 1.6} strokeLinecap="round" />}
					</g>
					<line x1={cx} y1={cy} x2={polar(cx, cy, R - 60, a)[0]} y2={polar(cx, cy, R - 60, a)[1]} stroke={tk.text} strokeWidth={tk.stroke.line} strokeLinecap="round" opacity={lin(f, sweepAt - 8, sweepAt)} />
					<circle cx={cx} cy={cy} r={tk.stroke.line * 2} fill={tk.text} opacity={lin(f, sweepAt - 8, sweepAt)} />
					<circle cx={polar(cx, cy, R, a)[0]} cy={polar(cx, cy, R, a)[1]} r={tk.stroke.heavy * (1.4 + 0.5 * Math.sin(settle * Math.PI))} fill={tk.c.surface} stroke={tk.series[0]} strokeWidth={tk.stroke.line} opacity={lin(f, sweepAt - 8, sweepAt)} />
				</svg>
				{[0, 6, 12, 18].map((h) => {
					const [x, y] = polar(cx, cy, R + 40, (h / 24) * 360);
					return (
						<span key={h} style={{position: 'absolute', left: x - 40, top: y - 22, width: 80, textAlign: 'center', ...txt(tk, 'mono', lab(tk, 0.82), tk.label), ...TAB, opacity: tick}}>
							{String(h).padStart(2, '0')}
						</span>
					);
				})}
				<div style={{position: 'absolute', left: cx - R * 0.62, width: R * 1.24, top: cy + R * 0.2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4}}>
					<span style={{...numCss(tk, Math.min(tk.size.h2 * 1.15, R * 0.36), tk.text)}}>{hhmm(now)}</span>
					<Label tk={tk} color={tk.accent}>{`${hrs}H ${String(mins).padStart(2, '0')}M`}</Label>
				</div>
				<div style={{position: 'absolute', left: pad, right: pad, bottom: pad, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 20}}>
					<span style={{...txt(tk, 'body', tk.size.body * 0.86, tk.text), whiteSpace: 'normal', opacity: enterP(tk, f, sweepAt + 44, 12)}}>{caption}</span>
					<span style={{...numCss(tk, tk.size.label, tk.label), flex: 'none'}}>{`${hhmm(from)}–${hhmm(to)}`}</span>
				</div>
			</Card>
		</div>
	);
};
