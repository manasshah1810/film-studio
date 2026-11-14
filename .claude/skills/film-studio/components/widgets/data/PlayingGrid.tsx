import React from 'react';
import {random} from 'remotion';
import {mix} from '../../engine/tokens';
import {boxPx, boxStyle, enterP, lin, txt} from '../social/tokens';
import {Card, Label, numCss} from './parts';
import {drawP, fmt, type DataBase, lab} from './tokens';

/**
 * 27 PlayingGrid. A calendar grid (columns = weeks, rows = days) plays through time: a playhead sweeps the columns, each
 * cell lights to its level as it passes, and the running total counts the cells played so far.
 */
export type PlayingGridProps = DataBase & {
	label: string; unit: string; cols?: number; rowsN?: number; levels?: number[]; total: number; marks?: string[]; caption: string; playAt?: number; playFrames?: number; seed: string;
};
export const PLAYING_GRID = {frames: 100, hero: 94, sfx: [{at: 'playAt', id: 'digital-tick'}, {at: 'playAt + playFrames', id: 'click-soft'}]};

export const PlayingGrid: React.FC<PlayingGridProps> = ({tk, frame: f, box, label, unit, cols = 20, rowsN = 7, levels, total, marks = [], caption, playAt = 14, playFrames = 66, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const pad = 52;
	const n = cols * rowsN;
	const lv = Array.from({length: n}, (_, i) => levels?.[i] ?? Math.floor(random(`${seed}-${i}`) ** 1.6 * 5));
	const sum = lv.reduce((s, x) => s + x, 0) || 1;
	const gap = 7;
	const cell = Math.min((W - pad * 2 - gap * (cols - 1)) / cols, 44);
	const gw = cols * cell + (cols - 1) * gap, gh = rowsN * cell + (rowsN - 1) * gap;
	const gx = (W - gw) / 2, gy = pad + 230;
	const p = drawP(tk, f, playAt, playFrames);
	const head = p * cols;
	let played = 0;
	const cells = lv.map((l, i) => {
		const c = Math.floor(i / rowsN), r = i % rowsN;
		const on = Math.max(0, Math.min(1, (head - c) * 2));
		played += (l / sum) * on;
		const fill = l === 0 ? tk.well : mix(tk.c.surface, tk.series[0], 0.18 + (0.82 * l) / 4);
		return (
			<rect key={i} x={gx + c * (cell + gap)} y={gy + r * (cell + gap)} width={cell} height={cell} rx={Math.min(6, tk.plateR / 2)} fill={on > 0 ? fill : tk.well} opacity={on > 0 ? 0.35 + 0.65 * on : 1} />
		);
	});
	const now = Math.round(total * Math.min(1, played) * 1e4) / 1e4;
	const px = gx + Math.min(gw, head * (cell + gap) - gap / 2);
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', flexDirection: 'column', gap: 12}}>
					<Label tk={tk}>{label}</Label>
					<div style={{display: 'flex', alignItems: 'baseline', gap: 16}}>
						<span style={{...numCss(tk, tk.numeral * 0.8, tk.accent)}}>{fmt(Math.round(now))}</span>
						<span style={{...txt(tk, 'body', tk.size.body * 0.86, tk.text)}}>{unit}</span>
					</div>
				</div>
				<svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					{cells}
					{p > 0 && p < 1 && <line x1={px} y1={gy - 22} x2={px} y2={gy + gh + 22} stroke={tk.series[1]} strokeWidth={tk.stroke.line} strokeLinecap="round" style={{filter: tk.glow(tk.series[1])}} />}
					{p > 0 && p < 1 && <path d={`M${px - 12} ${gy - 34} L${px + 12} ${gy - 34} L${px} ${gy - 20} Z`} fill={tk.series[1]} />}
				</svg>
				{marks.map((m, i) => (
					<span key={m} style={{position: 'absolute', left: gx + (i / marks.length) * gw, top: gy + gh + 22, ...txt(tk, 'mono', lab(tk, 0.72), tk.label), ...{opacity: lin(f, 6 + i * 2, 14 + i * 2)}}}>
						{m}
					</span>
				))}
				<div style={{position: 'absolute', left: pad, right: pad, bottom: pad, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20}}>
					<span style={{...txt(tk, 'body', tk.size.body * 0.82, tk.text), whiteSpace: 'normal', opacity: enterP(tk, f, playAt + playFrames - 6, 12)}}>{caption}</span>
					<div style={{display: 'flex', alignItems: 'center', gap: 6, flex: 'none'}}>
						{[0, 1, 2, 3, 4].map((l) => (
							<div key={l} style={{width: 22, height: 22, borderRadius: 4, background: l === 0 ? tk.well : mix(tk.c.surface, tk.series[0], 0.18 + (0.82 * l) / 4)}} />
						))}
					</div>
				</div>
			</Card>
		</div>
	);
};
