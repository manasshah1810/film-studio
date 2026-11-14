import React from 'react';
import {boxPx, boxStyle, enterP, popP, txt} from '../social/tokens';
import {Card, Label, Odometer, numCss} from './parts';
import {rollP, type DataBase} from './tokens';

/** 21 CloneRow. One unit cloned into a row ("3 in 10"): clones stamp in, then the counted ones light up as the count rolls. */
export type CloneUnit = 'square' | 'circle' | 'coin' | 'bar';
export type CloneRowProps = DataBase & {count: number; hit: number; unit?: CloneUnit; label: string; caption: string; perRow?: number; hitAt?: number; seed: string};
export const CLONE_ROW = {frames: 90, hero: 82, sfx: [{at: '6 + i * 2', id: 'tactile-pop'}, {at: 'hitAt + i * stagger', id: 'digital-tick'}]};

const Unit: React.FC<{unit: CloneUnit; s: number; fill: string; line: string; w: number; on: boolean; glow: string}> = ({unit, s, fill, line, w, on, glow}) => {
	const c = on ? fill : 'none';
	const st = on ? fill : line;
	return (
		<svg width={s} height={s} viewBox="0 0 100 100" style={{display: 'block', overflow: 'visible', filter: on ? glow : 'none'}}>
			{unit === 'square' && <rect x={8} y={8} width={84} height={84} rx={14} fill={c} stroke={st} strokeWidth={w} />}
			{unit === 'circle' && <circle cx={50} cy={50} r={42} fill={c} stroke={st} strokeWidth={w} />}
			{unit === 'coin' && (
				<>
					<circle cx={50} cy={50} r={42} fill={c} stroke={st} strokeWidth={w} />
					<circle cx={50} cy={50} r={26} fill="none" stroke={on ? line : st} strokeWidth={w * 0.7} opacity={on ? 0.55 : 1} />
				</>
			)}
			{unit === 'bar' && <rect x={30} y={4} width={40} height={92} rx={10} fill={c} stroke={st} strokeWidth={w} />}
		</svg>
	);
};

export const CloneRow: React.FC<CloneRowProps> = ({tk, frame: f, box, count, hit, unit = 'square', label, caption, perRow = 5, hitAt = 34}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const pad = 56;
	const rows = Math.ceil(count / perRow);
	const gap = 22;
	const s = Math.min((W - pad * 2 - gap * (perRow - 1)) / perRow, 150);
	const each = Math.max(2, Math.round(tk.stagger / 2));
	const roll = rollP(tk, f, hitAt, Math.max(18, hit * each + 10));
	const lit = Math.round(roll * hit * 1000) / 1000;
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', inset: pad, display: 'flex', flexDirection: 'column', gap: 26}}>
					<Label tk={tk}>{label}</Label>
					<div style={{display: 'flex', alignItems: 'baseline', gap: 22}}>
						<Odometer tk={tk} from={0} to={hit} p={roll} size={tk.numeral} color={tk.accent} />
						<span style={{...numCss(tk, tk.size.h2, tk.text)}}>{`in ${count}`}</span>
					</div>
					<div style={{display: 'grid', gridTemplateColumns: `repeat(${perRow}, ${s}px)`, gap, marginTop: 6}}>
						{Array.from({length: count}, (_, i) => {
							const pop = popP(tk, f, 6 + i * 2);
							const on = i < Math.floor(lit) || (i < hit && lit - i > 0.5);
							return (
								<div key={i} style={{transform: `scale(${pop})`, opacity: Math.min(1, pop * 2)}}>
									<Unit unit={unit} s={s} fill={tk.series[0]} line={tk.grid} w={tk.stroke.hair * 2.2} on={on} glow={tk.glow(tk.series[0])} />
								</div>
							);
						})}
					</div>
					<span style={{...txt(tk, 'body', tk.size.body * 0.86, tk.text), whiteSpace: 'normal', marginTop: rows > 2 ? 0 : 8, opacity: enterP(tk, f, hitAt + 20, 12)}}>{caption}</span>
				</div>
			</Card>
		</div>
	);
};
