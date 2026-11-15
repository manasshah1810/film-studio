import React from 'react';
import {type BespokeScene} from '../kit';

/**
 * s4: what buyers thought they bought. Four package cards of growing size stack up, each fills with coin glyphs as a
 * caret buys it, and a hope line climbs past them. No prices and no counts: package sizes are illustrative.
 */
export const CoinPackages: BespokeScene = ({kit}) => {
	const {frame: f, box, role, ease, pop} = kit;
	const W = box.width, H = box.height;
	const n = 4, gap = W * 0.04, cw = (W - gap * (n + 1)) / n;
	const hope = ease('draw', 40, 50);
	const pts = Array.from({length: 24}).map((_, i) => {
		const t = (i / 23) * hope;
		return `${gap + t * (W - 2 * gap)},${H * 0.3 - t * t * H * 0.24}`;
	}).join(' ');
	return (
		<div style={{position: 'absolute', ...box}}>
			<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{overflow: 'visible'}}>
				{Array.from({length: n}).map((_, i) => {
					const ch = H * (0.3 + i * 0.13), x = gap + i * (cw + gap), y = H * 0.96 - ch;
					const s = Math.min(1.06, pop(4 + i * 7));
					const bought = f > 18 + i * 9;
					const coins = 2 + i * 2, cols = 2, cr = Math.min(cw * 0.17, 26);
					return (
						<g key={i} transform={`translate(${x + cw / 2} ${y + ch}) scale(${s}) translate(${-cw / 2} ${-ch})`}>
							<rect width={cw} height={ch} rx={22} fill={role('surface')} stroke={bought ? role('primary') : role('ink')} strokeOpacity={bought ? 1 : 0.35} strokeWidth={5} />
							<rect x={cw * 0.3} y={-14} width={cw * 0.4} height={22} rx={8} fill={bought ? role('primary') : role('ink')} opacity={bought ? 1 : 0.35} />
							{Array.from({length: coins}).map((__, c) => {
								const on = bought && f > 20 + i * 9 + c * 2;
								const cx = cw * (0.3 + (c % cols) * 0.4), cy = ch - cr * 1.6 - Math.floor(c / cols) * cr * 2.3;
								return (
									<g key={c} opacity={on ? 1 : 0}>
										<circle cx={cx} cy={cy} r={cr} fill="none" stroke={role('primary')} strokeWidth={5} />
										<line x1={cx} y1={cy - cr * 0.5} x2={cx} y2={cy + cr * 0.5} stroke={role('primary')} strokeWidth={5} />
									</g>
								);
							})}
						</g>
					);
				})}
				<polyline points={pts} fill="none" stroke={role('primary')} strokeWidth={7} strokeLinecap="round" strokeDasharray="2 16" />
			</svg>
		</div>
	);
};
