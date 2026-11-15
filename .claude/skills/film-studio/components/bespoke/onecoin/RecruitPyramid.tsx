import React from 'react';
import {type BespokeScene} from '../kit';

/**
 * s4 / s5: a recruitment tree four tiers deep (1, 2, 4, 8). Each buyer spawns two more and money climbs every edge to
 * the top. phase "product": each coin badge is crossed out, then every node is stamped with a barcode:
 * the recruits were the merchandise. No person is drawn (dark-neon-dataviz is people-free).
 */
export const RecruitPyramid: BespokeScene = ({kit}) => {
	const {frame: f, box, role, ease, pop} = kit;
	const W = box.width, H = box.height;
	const product = kit.props.phase === 'product';
	const tiers = [1, 2, 4, 8];
	const pos = tiers.map((n, t) => Array.from({length: n}).map((_, i) => ({x: W * ((i + 0.5) / n) * (0.4 + t * 0.2) + W * (0.3 - t * 0.1), y: H * (0.1 + t * 0.27)})));
	const born = (t: number, i: number) => (product ? 0 : 4 + t * 12 + i * 2);
	const nr = (t: number) => Math.max(product ? 24 : 18, (product ? 48 : 40) - t * 7);
	const turn = product ? ease('pop', 16, 14) : 0;
	const strike = product ? ease('draw', 4, 10) : 0;
	return (
		<div style={{position: 'absolute', ...box}}>
			<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{overflow: 'visible'}}>
				{pos.slice(1).map((row, t) => row.map((p, i) => {
					const up = pos[t][Math.floor(i / 2)];
					const d = ease('draw', born(t + 1, i), 10);
					const flow = ((f - born(t + 1, i) - 6) / 26) % 1;
					return (
						<g key={`e${t}-${i}`}>
							<line x1={up.x} y1={up.y} x2={up.x + (p.x - up.x) * d} y2={up.y + (p.y - up.y) * d} stroke={role('ink')} strokeOpacity={0.4} strokeWidth={5} />
							{f > born(t + 1, i) + 6 && !product ? <circle cx={p.x + (up.x - p.x) * flow} cy={p.y + (up.y - p.y) * flow} r={9} fill={role('primary')} /> : null}
						</g>
					);
				}))}
				{pos.map((row, t) => row.map((p, i) => {
					const s = Math.min(1.1, pop(born(t, i)));
					const r = nr(t) * (t === 0 && !product ? 1 + Math.min(0.5, Math.max(0, f - 40) / 120) : 1);
					return (
						<g key={`n${t}-${i}`} transform={`translate(${p.x} ${p.y}) scale(${s})`}>
							<circle r={r} fill={role('surface')} stroke={t === 0 ? role('primary') : role('ink')} strokeWidth={t === 0 ? 7 : 4} />
							{product ? (
								<g opacity={strike * (1 - turn * 0.6)}>
									<line x1={-r * 0.7} y1={-r * 0.7} x2={r * 0.7} y2={r * 0.7} stroke={role('highlight')} strokeWidth={6} strokeLinecap="round" />
									<line x1={r * 0.7} y1={-r * 0.7} x2={-r * 0.7} y2={r * 0.7} stroke={role('highlight')} strokeWidth={6} strokeLinecap="round" />
								</g>
							) : null}
							<g opacity={1 - turn}>
								<circle r={r * 0.5} fill="none" stroke={role('primary')} strokeWidth={4} />
								<line x1={0} y1={-r * 0.28} x2={0} y2={r * 0.28} stroke={role('primary')} strokeWidth={4} />
							</g>
							{product ? (
								<g opacity={turn}>
									{[-0.42, -0.26, -0.14, 0.02, 0.12, 0.26, 0.4].map((x, j) => (
										<rect key={j} x={x * r} y={-r * 0.36} width={r * (j % 3 === 0 ? 0.1 : 0.06)} height={r * 0.72} fill={role('highlight')} />
									))}
								</g>
							) : null}
						</g>
					);
				}))}
			</svg>
		</div>
	);
};
