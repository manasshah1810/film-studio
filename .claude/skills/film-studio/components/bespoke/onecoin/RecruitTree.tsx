import React from 'react';
import {type BespokeScene} from '../kit';

/**
 * s5 turn: a recruitment tree grows DOWNWARD from one crown (1, 2, 4, 8). Money climbs every branch to the
 * top. props.phase "product": each coin turns hollow (the coin was the excuse) and every recruit node is
 * circled and wears a red price tag (the recruit was the product).
 */
export const RecruitTree: BespokeScene = ({kit}) => {
	const {frame: f, box, role, ease, pop, k} = kit;
	const W = box.width, H = box.height, product = kit.props.phase === 'product';
	const tiers = [1, 2, 4, 8];
	const pos = tiers.map((n, t) => Array.from({length: n}).map((_, i) => ({x: W * (0.5 + ((i + 0.5) / n - 0.5) * (0.3 + t * 0.23)), y: H * (0.1 + t * 0.26)})));
	const born = (t: number, i: number) => (product ? -60 : 2 + t * 14 + i * 2);
	const strike = product ? ease('draw', 4, 12) : 0, tag = product ? ease('settle', 8, 16) : 0;
	return (
		<div style={{position: 'absolute', ...box}}>
			<svg width={W} height={H} style={{overflow: 'visible'}}>
				{pos.slice(1).map((row, t) => row.map((p, i) => {
					const up = pos[t][Math.floor(i / 2)], d = ease('draw', born(t + 1, i), 10), flow = (((f - born(t + 1, i)) / 22) % 1 + 1) % 1;
					return (
						<g key={`e${t}${i}`}>
							<line x1={up.x} y1={up.y} x2={up.x + (p.x - up.x) * d} y2={up.y + (p.y - up.y) * d} stroke={role('surface')} strokeOpacity={0.55} strokeWidth={5 * k} />
							{d >= 1 ? <circle cx={p.x + (up.x - p.x) * flow} cy={p.y + (up.y - p.y) * flow} r={8 * k} fill={role('highlight')} /> : null}
						</g>
					);
				}))}
				{pos.map((row, t) => row.map((p, i) => {
					const s = Math.min(1.08, pop(born(t, i))), r = Math.max(20, 46 - t * 8) * k;
					return (
						<g key={`n${t}${i}`} transform={`translate(${p.x} ${p.y}) scale(${s.toFixed(3)})`}>
							{t === 0 ? <path d={`M ${-r} ${-r * 0.9} L ${-r * 0.5} ${-r * 1.5} L 0 ${-r * 1.0} L ${r * 0.5} ${-r * 1.5} L ${r} ${-r * 0.9} Z`} fill={role('highlight')} stroke={role('ink')} strokeWidth={3 * k} /> : null}
							<circle r={r} fill={role('surface')} stroke={t === 0 ? role('primary') : role('ink')} strokeWidth={(t === 0 ? 7 : 4) * k} />
							{/* the coin at each node: solid while it grows, hollow (never existed) once the turn lands */}
							<circle r={r * 0.45} fill={product ? 'none' : role('highlight')} stroke={product ? role('ink') : role('ink')} strokeWidth={2 * k} strokeDasharray={product ? `${4 * k} ${4 * k}` : undefined} opacity={product ? 1 - 0.6 * strike : 1} />
							{/* the turn: every recruit gets a red price tag; the recruit was the product */}
							{product && t > 0 ? (
								<g opacity={tag} transform={`translate(${r * 0.55} ${-r * 1.25}) rotate(${-18 + i * 7}) scale(${((0.6 + 0.4 * tag) * (t === 3 ? 1.5 : 1.9)).toFixed(3)})`}>
									<path d={`M 0 0 L ${r * 1.1} 0 L ${r * 1.4} ${r * 0.35} L ${r * 1.1} ${r * 0.7} L 0 ${r * 0.7} Z`} fill={role('primary')} stroke={role('ink')} strokeWidth={2 * k} />
									<circle cx={r * 1.12} cy={r * 0.35} r={r * 0.1} fill={role('surface')} />
								</g>
							) : null}
							{product && t > 0 ? <circle r={r * 1.3} fill="none" stroke={role('primary')} strokeWidth={4 * k} strokeDasharray={`${r * 8.2}`} strokeDashoffset={r * 8.2 * (1 - tag)} /> : null}
						</g>
					);
				}))}
			</svg>
		</div>
	);
};
