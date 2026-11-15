import React from 'react';
import {span, type BespokeScene} from '../kit';

/** s1 hook: a blockchain of five linked blocks assembles, then every link snaps and the blocks crash to the floor as loose wreckage: no chain. */
export const BrokenChain: BespokeScene = ({kit}) => {
	const {frame: f, box, role, font, ease, pop} = kit;
	const W = box.width, H = box.height;
	const breakAt = Number(kit.props.breakAt ?? 54);
	const n = 5, bw = W * 0.15, gap = (W - n * bw) / (n + 1), cy = H * 0.52;
	const label = String(kit.props.label ?? 'BLOCKCHAIN');
	const strike = ease('draw', breakAt + 4, 12);
	return (
		<div style={{position: 'absolute', ...box}}>
			<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{overflow: 'visible'}}>
				{Array.from({length: n - 1}).map((_, i) => {
					const x1 = gap + i * (bw + gap) + bw, x2 = x1 + gap;
					const on = ease('draw', 6 + i * 6, 10);
					const snap = span(f, breakAt + i * 2, breakAt + i * 2 + 10);
					const mid = (x1 + x2) / 2;
					return (
						<g key={i} opacity={1 - snap * 0.9}>
							<line x1={x1} y1={cy} x2={x1 + (mid - x1) * on - snap * 18} y2={cy - snap * 30} stroke={role('primary')} strokeWidth={10} strokeLinecap="round" />
							<line x1={x2 - (x2 - mid) * on + snap * 18} y1={cy} x2={x2} y2={cy + snap * 30} stroke={role('primary')} strokeWidth={10} strokeLinecap="round" />
						</g>
					);
				})}
				{Array.from({length: n}).map((_, i) => {
					const x = gap + i * (bw + gap);
					const p = Math.min(1.08, pop(i * 6));
					const fall = Math.max(0, f - breakAt - 6 - i * 3);
					const floor = H * 0.86 - cy - bw / 2 + (i % 2) * 8;
					const dy = Math.min(floor, 0.9 * fall * fall * (0.6 + (i % 2) * 0.5));
					const rot = Math.min(1, dy / Math.max(1, floor)) * (i % 2 ? 24 : -19) + (i - 2) * 3 * Math.min(1, dy / Math.max(1, floor));
					const broken = f > breakAt + 2;
					return (
						<g key={i} transform={`translate(${x + bw / 2} ${cy + dy}) rotate(${rot}) scale(${p})`}>
							<rect x={-bw / 2} y={-bw / 2} width={bw} height={bw} rx={bw * 0.16} fill={role('surface')} stroke={broken ? role('highlight') : role('primary')} strokeWidth={6} />
							{[0, 1, 2].map((r) => <rect key={r} x={-bw * 0.3} y={-bw * 0.24 + r * bw * 0.2} width={bw * (r === 2 ? 0.36 : 0.6)} height={bw * 0.08} rx={4} fill={role('ink')} opacity={0.55} />)}
						</g>
					);
				})}
			</svg>
			<div style={{position: 'absolute', left: 28, top: 0, ...font('mono', 64), color: role('ink'), opacity: ease('draw', 0, 10)}}>
				<span style={{position: 'relative'}}>
					{label}
					<span style={{position: 'absolute', left: -6, top: '52%', height: 6, width: `calc(${strike * 100}% + 12px)`, background: role('highlight'), borderRadius: 4}} />
				</span>
			</div>
		</div>
	);
};
