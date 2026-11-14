import React from 'react';
import {boxPx, boxStyle, enterP, lin, txt} from '../social/tokens';
import {Card, Label, Odometer, arc, polar} from './parts';
import {drawP, lockP, rollP, type DataBase} from './tokens';

/** 23 OrbitRing. A share as a ring: the gauge fills to `value` %, a dot rides its tip, outer and inner rings counter-rotate. */
export type OrbitRingProps = DataBase & {value: number; dec?: number; label: string; caption: string; fillAt?: number; seed: string};
export const ORBIT_RING = {frames: 90, hero: 84, sfx: [{at: 'fillAt', id: 'digital-tick'}, {at: 'fillAt + 56', id: 'tactile-pop'}]};

export const OrbitRing: React.FC<OrbitRingProps> = ({tk, frame: f, box, value, dec = 0, label, caption, fillAt = 16}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const pad = 56;
	const top = 130;
	const R = Math.min((W - pad * 2) / 2 - 30, (H - top - 170) / 2);
	const cx = W / 2, cy = top + R + 30;
	const p = drawP(tk, f, fillAt, 56);
	const roll = rollP(tk, f, fillAt, 56);
	const a = (value / 100) * 360 * p;
	const lock = lockP(tk, f, fillAt + 56);
	const [dx, dy] = polar(cx, cy, R, a);
	const show = lin(f, 2, 14);
	const ringR = [R + 30, R - 34];
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, top: pad, right: pad}}>
					<Label tk={tk}>{label}</Label>
				</div>
				<svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					<g transform={`rotate(${-f * 0.5} ${cx} ${cy})`} opacity={show}>
						{Array.from({length: 72}, (_, i) => {
							const [x0, y0] = polar(cx, cy, ringR[0], i * 5);
							const [x1, y1] = polar(cx, cy, ringR[0] + (i % 6 === 0 ? 18 : 8), i * 5);
							return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={tk.grid} strokeWidth={tk.stroke.hair} />;
						})}
					</g>
					<circle cx={cx} cy={cy} r={ringR[1]} fill="none" stroke={tk.grid} strokeWidth={tk.stroke.hair} strokeDasharray="4 14" transform={`rotate(${f * 0.9} ${cx} ${cy})`} opacity={show} />
					<circle cx={cx} cy={cy} r={R} fill="none" stroke={tk.grid} strokeWidth={tk.stroke.heavy * 2} opacity={show} />
					<g style={{filter: tk.glow(tk.series[0])}}>
						{a > 0.5 && <path d={arc(cx, cy, R, 0, a)} fill="none" stroke={tk.series[0]} strokeWidth={tk.stroke.heavy * 2} strokeLinecap="round" />}
					</g>
					{a > 0.5 && <circle cx={dx} cy={dy} r={tk.stroke.heavy * (1.1 + 0.35 * Math.sin(Math.min(1, lock) * Math.PI))} fill={tk.series[1]} stroke={tk.c.surface} strokeWidth={tk.stroke.hair * 2} />}
				</svg>
				<div style={{position: 'absolute', left: cx - R * 0.8, width: R * 1.6, top: cy - tk.numeral * 0.62, display: 'flex', justifyContent: 'center', transform: `scale(${1 + 0.04 * Math.sin(Math.min(1, lock) * Math.PI)})`}}>
					<Odometer tk={tk} from={0} to={value} p={roll} dec={dec} size={Math.min(tk.numeral, R * 0.62)} color={tk.text} suffix="%" />
				</div>
				<div style={{position: 'absolute', left: pad, right: pad, bottom: pad}}>
					<span style={{...txt(tk, 'body', tk.size.body * 0.86, tk.text), whiteSpace: 'normal', display: 'block', textAlign: 'center', opacity: enterP(tk, f, fillAt + 50, 12)}}>{caption}</span>
				</div>
			</Card>
		</div>
	);
};
