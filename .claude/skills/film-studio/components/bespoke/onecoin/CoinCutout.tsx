import React from 'react';
import {type BespokeScene} from '../kit';

/**
 * s1 hook: a gold coin spins like an investment, then turns edge-on and is revealed as a paper-thin cutout
 * with nothing behind it (a torn paper sliver and an empty dashed outline where the coin "was").
 * props.revealAt (frames): when the coin flattens.
 */
export const CoinCutout: BespokeScene = ({kit}) => {
	const {frame: f, box, role, ease, pop, k} = kit;
	const W = box.width, H = box.height, cx = W / 2, cy = H * 0.5, R = Math.min(W, H) * 0.36;
	const at = Number(kit.props.revealAt ?? 45);
	const enter = Math.min(1.08, 0.82 + 0.18 * pop(0)); // already on screen at frame 0: the cover frame shows the full coin
	const spin = f < at ? Math.cos(Math.max(0, f - 12) * 0.16) : 0.04 + 0.96 * (1 - ease('settle', at, 14)) * Math.cos(at * 0.16);
	const flat = ease('tear', at, 14), ghost = ease('fade', at + 10, 16);
	const sx = Math.max(0.035, Math.abs(spin)) * (1 - flat) + 0.035 * flat;
	return (
		<div style={{position: 'absolute', ...box}}>
			<svg width={W} height={H} style={{overflow: 'visible'}}>
				<ellipse cx={cx} cy={cy + R * 1.12} rx={R * 0.9 * (1 - flat * 0.7)} ry={R * 0.12} fill={role('ink')} opacity={0.35} />
				<circle cx={cx} cy={cy} r={R} fill="none" stroke={role('surface')} strokeWidth={4 * k} strokeDasharray={`${14 * k} ${12 * k}`} opacity={ghost * 0.9} />
				<g transform={`translate(${cx} ${cy}) scale(${(sx * enter).toFixed(4)} ${enter.toFixed(4)})`}>
					<circle r={R} fill={role('highlight')} stroke={role('ink')} strokeWidth={10 * k} />
					<circle r={R * 0.78} fill="none" stroke={role('ink')} strokeWidth={5 * k} opacity={0.55} />
					<text x={0} y={R * 0.36} textAnchor="middle" style={{...kit.font('display', R / k * 1.05), fill: role('ink')}} opacity={0.85 * (1 - flat)}>1</text>
				</g>
				{flat > 0 ? (
					<g opacity={flat}>
						<path d={`M ${cx - 6 * k} ${cy - R} L ${cx + 5 * k} ${cy - R * 0.5} L ${cx - 4 * k} ${cy} L ${cx + 6 * k} ${cy + R * 0.5} L ${cx - 5 * k} ${cy + R}`} fill="none" stroke={role('surface')} strokeWidth={3 * k} />
						<path d={`M ${cx - R * 1.15} ${cy} A ${R * 1.15} ${R * 1.15} 0 1 1 ${cx - R * 1.15 + 0.1} ${cy + 1}`} fill="none" stroke={role('primary')} strokeWidth={9 * k} strokeLinecap="round" strokeDasharray={`${R * 7.3}`} strokeDashoffset={R * 7.3 * (1 - ease('draw', at + 18, 22))} />
					</g>
				) : null}
			</svg>
		</div>
	);
};
