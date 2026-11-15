import React from 'react';
import {type BespokeScene} from '../kit';

/**
 * s6 payoff: a relay of paper-cutout hands passes one coin down the line; each hand that passes it pops a
 * commission slip. Beside them a ledger book stays chained shut: nobody can check it. props.phase "ledger":
 * the chained-shut ledger fills the card while paid slips pile up beside it.
 */
const Hand: React.FC<{x: number; y: number; s: number; ink: string; paper: string; k: number; flip: boolean}> = ({x, y, s, ink, paper, k, flip}) => (
	<g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
		<path d="M -40 30 L -40 -10 Q -40 -28 -26 -28 L 20 -28 Q 34 -28 34 -16 Q 34 -6 22 -6 L 6 -6 L 30 -6 Q 44 -6 44 6 Q 44 16 32 16 L 28 16 Q 38 18 36 28 Q 34 36 22 36 L -40 36 Z" fill={paper} stroke={ink} strokeWidth={4 / s * k} strokeLinejoin="round" />
		<rect x={-70} y={-14} width={32} height={56} fill={ink} opacity={0.8} />
	</g>
);

export const HandRelay: BespokeScene = ({kit}) => {
	const {frame: f, frames, box, role, ease, pop, k} = kit;
	const W = box.width, H = box.height, n = 4;
	const xs = Array.from({length: n}).map((_, i) => W * (0.1 + i * 0.22)), y = H * 0.36, step = Math.max(14, Math.floor((frames - 20) / n));
	const leg = Math.min(n - 1.001, Math.max(0, (f - 6) / step));
	const i0 = Math.floor(leg), u = ease('settle', 6 + i0 * step, step * 0.8);
	const cx = xs[i0] + (xs[Math.min(n - 1, i0 + 1)] - xs[i0]) * u + W * 0.05, cy = y - H * 0.1 - Math.sin(u * Math.PI) * H * 0.12;
	const chain = ease('draw', 0, 20);
	if (kit.props.phase === 'ledger') {
		// the payoff's second picture: the ledger, chained shut, with the paid slips piling up beside it
		const lock = ease('settle', 0, 14), pile = Math.min(9, Math.floor(f / 6));
		return (
			<div style={{position: 'absolute', ...box}}>
				<svg width={W} height={H} style={{overflow: 'visible'}}>
					<g transform={`translate(${W * 0.4} ${H * 0.5}) scale(${(0.85 + 0.15 * lock).toFixed(3)})`}>
						<rect x={-W * 0.3} y={-H * 0.38} width={W * 0.6} height={H * 0.76} rx={10 * k} fill={role('surface')} stroke={role('ink')} strokeWidth={6 * k} />
						<line x1={0} y1={-H * 0.38} x2={0} y2={H * 0.38} stroke={role('ink')} strokeWidth={4 * k} />
						{[-1, 1].map((s) => <line key={s} x1={-W * 0.36} y1={s * H * 0.42} x2={W * 0.36} y2={-s * H * 0.42} stroke={role('primary')} strokeWidth={14 * k} strokeDasharray={`${22 * k} ${9 * k}`} strokeLinecap="round" opacity={lock} />)}
						<rect x={-W * 0.07} y={-H * 0.08} width={W * 0.14} height={H * 0.16} rx={6 * k} fill={role('primary')} stroke={role('ink')} strokeWidth={3 * k} />
					</g>
					{Array.from({length: pile + 1}).map((_, i) => (
						<g key={i} transform={`translate(${W * 0.84} ${H * (0.86 - i * 0.075)}) rotate(${((i * 37) % 14) - 7})`}>
							<rect x={-W * 0.1} y={-H * 0.035} width={W * 0.2} height={H * 0.07} fill={role('highlight')} stroke={role('ink')} strokeWidth={3 * k} />
							<rect x={-W * 0.07} y={-H * 0.008} width={W * 0.14} height={H * 0.014} fill={role('ink')} opacity={0.7} />
						</g>
					))}
				</svg>
			</div>
		);
	}
	return (
		<div style={{position: 'absolute', ...box}}>
			<svg width={W} height={H} style={{overflow: 'visible'}}>
				{xs.map((x, i) => <Hand key={i} x={x} y={y} s={1.05 * k} ink={role('ink')} paper={role('surface')} k={k} flip={false} />)}
				{xs.slice(0, n - 1).map((x, i) => {
					const s = Math.min(1.1, pop(6 + (i + 1) * step - 4));
					return (
						<g key={i} transform={`translate(${x} ${y + H * 0.14}) rotate(${-8 + i * 5}) scale(${s.toFixed(3)})`} opacity={s > 0.05 ? 1 : 0}>
							<rect x={-W * 0.07} y={-H * 0.035} width={W * 0.14} height={H * 0.07} fill={role('highlight')} stroke={role('ink')} strokeWidth={3 * k} />
							<rect x={-W * 0.05} y={-H * 0.008} width={W * 0.1} height={H * 0.014} fill={role('ink')} opacity={0.7} />
						</g>
					);
				})}
				<circle cx={cx} cy={cy} r={22 * k} fill={role('highlight')} stroke={role('ink')} strokeWidth={5 * k} />
				<g transform={`translate(${W * 0.5} ${H * 0.78})`}>
					<rect x={-W * 0.22} y={-H * 0.1} width={W * 0.44} height={H * 0.2} rx={8 * k} fill={role('surface')} stroke={role('ink')} strokeWidth={5 * k} />
					<line x1={0} y1={-H * 0.1} x2={0} y2={H * 0.1} stroke={role('ink')} strokeWidth={3 * k} />
					{[-1, 1].map((s) => <line key={s} x1={-W * 0.26} y1={s * H * 0.12} x2={-W * 0.26 + W * 0.52 * chain} y2={-s * H * 0.12 * (2 * chain - 1)} stroke={role('primary')} strokeWidth={9 * k} strokeDasharray={`${16 * k} ${7 * k}`} strokeLinecap="round" />)}
					<rect x={-W * 0.04} y={-H * 0.05} width={W * 0.08} height={H * 0.08} rx={4 * k} fill={role('primary')} opacity={chain} />
				</g>
			</svg>
		</div>
	);
};
