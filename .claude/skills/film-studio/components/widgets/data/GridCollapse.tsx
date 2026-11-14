import React from 'react';
import {random} from 'remotion';
import {boxPx, boxStyle, enterP, lin, popP, txt} from '../social/tokens';
import {Card, Label, Odometer} from './parts';
import {drawP, rollP, type DataBase} from './tokens';

/**
 * 28 GridCollapse. A full grid (e.g. 100 startups) collapses: all but `keep` cells shrink and drop away in a seeded order
 * while the count rolls down, then the survivors slide together into one centred row.
 */
export type GridCollapseProps = DataBase & {cols?: number; rowsN?: number; keep: number; label: string; caption: string; collapseAt?: number; seed: string};
export const GRID_COLLAPSE = {frames: 110, hero: 104, sfx: [{at: 'collapseAt', id: 'static-zap'}, {at: 'collapseAt + 30', id: 'digital-tick'}, {at: 'collapseAt + 52', id: 'tactile-pop'}]};

export const GridCollapse: React.FC<GridCollapseProps> = ({tk, frame: f, box, cols = 10, rowsN = 10, keep, label, caption, collapseAt = 28, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const pad = 52;
	const n = cols * rowsN;
	const gap = 10;
	const top = pad + 220;
	const cell = Math.min((W - pad * 2 - gap * (cols - 1)) / cols, (H - top - 160 - gap * (rowsN - 1)) / rowsN);
	const gw = cols * cell + (cols - 1) * gap;
	const gx = (W - gw) / 2;
	// Survivors: `keep` cells chosen by seed. Everyone else gets a seeded drop delay.
	const order = Array.from({length: n}, (_, i) => i).sort((a, b) => random(`${seed}-o${a}`) - random(`${seed}-o${b}`));
	const alive = new Set(order.slice(0, keep));
	const fall = drawP(tk, f, collapseAt, 30);
	const count = rollP(tk, f, collapseAt, 30);
	const gather = drawP(tk, f, collapseAt + 34, 18);
	const land = popP(tk, f, collapseAt + 52);
	const kept = order.slice(0, keep).sort((a, b) => a - b);
	const rowCell = Math.min(cell * 1.5, (gw - gap * (keep - 1)) / keep);
	const rowW = keep * rowCell + (keep - 1) * gap;
	const rowY = top + (rowsN * (cell + gap)) / 2 - rowCell / 2;
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', flexDirection: 'column', gap: 10}}>
					<Label tk={tk}>{label}</Label>
					<div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
						<Odometer tk={tk} from={n} to={keep} p={count} size={tk.numeral * 0.9} color={count >= 1 ? tk.accent : tk.text} group={false} />
						<span style={{...txt(tk, 'body', tk.size.body * 0.86, tk.label)}}>{`of ${n} left`}</span>
					</div>
				</div>
				<svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					{Array.from({length: n}, (_, i) => {
						const c = i % cols, r = Math.floor(i / cols);
						const x = gx + c * (cell + gap), y = top + r * (cell + gap);
						const inP = lin(f, 2 + (c + r) * 0.6, 10 + (c + r) * 0.6);
						if (alive.has(i)) {
							const k = kept.indexOf(i);
							const tx = (W - rowW) / 2 + k * (rowCell + gap);
							const s = cell + (rowCell - cell) * gather;
							const lx = x + (tx - x) * gather, ly = y + (rowY - y) * gather;
							const lit = lin(f, collapseAt + 4, collapseAt + 14);
							return (
								<rect key={i} x={lx} y={ly - (land > 0 ? Math.sin(Math.min(1, land) * Math.PI) * 10 : 0)} width={s} height={s} rx={Math.min(8, tk.plateR / 2)} fill={lit > 0.5 ? tk.series[0] : tk.grid} opacity={inP} style={{filter: lit > 0.5 ? tk.glow(tk.series[0]) : 'none'}} />
							);
						}
						const d = random(`${seed}-d${i}`) * 0.55;
						const q = Math.max(0, Math.min(1, (fall - d) / 0.45));
						const s = cell * (1 - q);
						return <rect key={i} x={x + (cell - s) / 2} y={y + (cell - s) / 2 + q * q * 120} width={s} height={s} rx={Math.min(8, tk.plateR / 2)} fill={tk.grid} opacity={inP * (1 - q)} />;
					})}
				</svg>
				<div style={{position: 'absolute', left: pad, right: pad, bottom: pad}}>
					<span style={{...txt(tk, 'body', tk.size.body * 0.86, tk.text), whiteSpace: 'normal', display: 'block', textAlign: 'center', opacity: enterP(tk, f, collapseAt + 52, 12)}}>{caption}</span>
				</div>
			</Card>
		</div>
	);
};
