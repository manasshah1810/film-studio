import React from 'react';
import {rnd, type BespokeScene} from '../kit';

/** s3: an arena seen from the back rows. Two spotlights find an empty stage and a mic; the crowd lights up wave by wave. */
export const ArenaPitch: BespokeScene = ({kit}) => {
	const {frame: f, box, role, ease, pop} = kit;
	const W = box.width, H = box.height;
	const sx = W / 2, sy = H * 0.24;
	const rows = 7;
	const sweep = Math.sin(f / 22) * 0.12;
	const lights = ease('focus', 0, 20);
	const stage = Math.min(1, pop(8));
	return (
		<div style={{position: 'absolute', ...box}}>
			<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{overflow: 'visible'}}>
				{[-1, 1].map((s) => {
					const tx = sx + s * W * 0.04 + sweep * W * s;
					return <polygon key={s} points={`${sx + s * W * 0.5},${-H * 0.05} ${tx - W * 0.1},${sy + 24} ${tx + W * 0.1},${sy + 24}`} fill={role('primary')} opacity={0.16 * lights} />;
				})}
				<ellipse cx={sx} cy={sy + 26} rx={W * 0.26 * stage} ry={H * 0.045 * stage} fill={role('surface')} stroke={role('primary')} strokeWidth={5} />
				<g opacity={stage} transform={`translate(${sx} ${sy - 4})`}>
					<line x1={0} y1={30} x2={0} y2={-48} stroke={role('ink')} strokeWidth={8} strokeLinecap="round" />
					<line x1={-22} y1={30} x2={22} y2={30} stroke={role('ink')} strokeWidth={8} strokeLinecap="round" />
					<rect x={-13} y={-80} width={26} height={40} rx={13} fill={role('primary')} />
				</g>
				{Array.from({length: rows}).map((_, r) => {
					const ry = sy + H * 0.14 + r * H * 0.085, rx = W * (0.2 + r * 0.043), count = 9 + r * 4;
					return Array.from({length: count}).map((__, i) => {
						const t = (i + 0.5) / count, a = Math.PI * (1.08 - t * 1.16);
						const x = sx + Math.cos(a) * rx, y = ry + Math.sin(a) * H * 0.03;
						const wave = f - 18 - r * 5 - rnd(r * 100 + i) * 8;
						const lit = wave > 0 ? Math.min(1, wave / 6) : 0;
						const flick = lit ? 0.75 + 0.25 * Math.sin(f / 3 + i) : 0;
						return <circle key={`${r}-${i}`} cx={x} cy={y + (lit ? -3 * Math.sin(f / 5 + i) : 0)} r={6 + r * 0.9} fill={lit ? role('primary') : role('ink')} opacity={lit ? flick : 0.22} />;
					});
				})}
			</svg>
		</div>
	);
};
