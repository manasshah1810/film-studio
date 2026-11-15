import React from 'react';
import {type BespokeScene} from '../kit';
import {rnd} from '../kit';

/**
 * s4: an arena seen from the back rows. Two spotlights sweep in from the wings and lock on an EMPTY podium
 * (the founder is never drawn); rows of phone lights rise through the crowd as the pitch lands.
 */
export const ArenaPodium: BespokeScene = ({kit}) => {
	const {frame: f, frames, box, role, ease, k} = kit;
	const W = box.width, H = box.height, px = W / 2, py = H * 0.42;
	const roar = !!kit.props.roar;
	const lock = roar ? 1 : ease('settle', 6, 30), lights = roar ? 1 : ease('draw', 24, Math.max(20, frames - 40));
	const flare = roar ? 1 - ease('fade', 0, 24) : 0;
	const sweep = (side: number) => side * (1 - lock) * 0.55 + side * 0.04 * Math.sin(f * 0.05);
	const beam = (side: number) => {
		const ox = side < 0 ? 0 : W, tx = px + W * sweep(side);
		return `M ${ox} ${-H * 0.05} L ${tx - W * 0.09} ${py + H * 0.12} L ${tx + W * 0.09} ${py + H * 0.12} Z`;
	};
	const rows = 5;
	return (
		<div style={{position: 'absolute', ...box}}>
			<svg width={W} height={H} style={{overflow: 'visible'}}>
				{[-1, 1].map((s) => <path key={s} d={beam(s)} fill={role('highlight')} opacity={0.22 + 0.1 * lock + 0.35 * flare} />)}
				{roar ? <circle cx={px} cy={py} r={W * (0.12 + 0.5 * (1 - flare))} fill="none" stroke={role('highlight')} strokeWidth={6 * k} opacity={flare} /> : null}
				<ellipse cx={px} cy={py + H * 0.12} rx={W * 0.14} ry={H * 0.025} fill={role('highlight')} opacity={0.5 * lock} />
				<path d={`M ${px - W * 0.08} ${py + H * 0.12} L ${px - W * 0.055} ${py - H * 0.04} L ${px + W * 0.055} ${py - H * 0.04} L ${px + W * 0.08} ${py + H * 0.12} Z`} fill={role('surface')} stroke={role('ink')} strokeWidth={4 * k} />
				<rect x={px - W * 0.07} y={py - H * 0.06} width={W * 0.14} height={H * 0.025} fill={role('primary')} />
				<line x1={px} y1={py - H * 0.06} x2={px + W * 0.02} y2={py - H * 0.13} stroke={role('ink')} strokeWidth={4 * k} />
				<circle cx={px + W * 0.022} cy={py - H * 0.14} r={7 * k} fill={role('ink')} />
				{Array.from({length: rows}).map((_, r) => {
					const y = H * (0.66 + r * 0.075), arc = 1 + r * 0.22, n = 9 + r * 3;
					return (
						<g key={r}>
							<path d={`M ${-W * 0.05} ${y + H * 0.03 * arc} Q ${px} ${y - H * 0.06} ${W * 1.05} ${y + H * 0.03 * arc}`} fill="none" stroke={role('surface')} strokeOpacity={0.35} strokeWidth={3 * k} />
							{Array.from({length: n}).map((__, i) => {
								const t = (i + 0.5) / n, x = -W * 0.03 + t * W * 1.06, yy = y + H * 0.03 * arc * (2 * Math.abs(t - 0.5)) ** 2 - H * 0.012;
								const on = lights * (rows + 2) - (rows - 1 - r) - rnd(r * 31 + i) > 0;
								return <circle key={i} cx={x} cy={yy - (on ? H * 0.01 : 0)} r={(on ? 6 : 4) * k} fill={on ? role('highlight') : role('surface')} opacity={on ? 0.95 : 0.25} />;
							})}
						</g>
					);
				})}
			</svg>
		</div>
	);
};
