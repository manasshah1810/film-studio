import React from 'react';
import {type BespokeScene} from '../kit';

/**
 * s7 close (unique, never the opening coin): a boarding pass tears in two, a dotted flight line draws toward
 * Athens and its radar blip fades over the sea. props.phase "book": the closing line's picture, one private
 * ledger page with a single handwritten balance circled in red pen. props.phase "left": a row of hands is left holding EMPTY coin
 * outlines: the recruits holding a coin that never existed.
 */
export const FlightFade: BespokeScene = ({kit}) => {
	const {frame: f, frames, box, role, ease, font, k} = kit;
	const W = box.width, H = box.height;
	if (kit.props.phase === 'book') {
		// the closing line's own picture: one page of the private book, a single handwritten balance, circled in red
		const page = ease('settle', 0, 16), pen = ease('draw', 10, 22), ring = ease('draw', 30, 24);
		const pw = W * 0.62, ph = H * 0.86, x0 = (W - pw) / 2, y0 = H * 0.06 + (1 - page) * H * 0.2;
		return (
			<div style={{position: 'absolute', ...box}}>
				<svg width={W} height={H} style={{overflow: 'visible'}}>
					<g opacity={page} transform={`rotate(-2 ${W / 2} ${H / 2})`}>
						<rect x={x0} y={y0} width={pw} height={ph} fill={role('surface')} stroke={role('ink')} strokeWidth={4 * k} />
						{[0, 1, 2, 3, 4, 5, 6].map((i) => <line key={i} x1={x0 + pw * 0.08} y1={y0 + ph * (0.14 + i * 0.11)} x2={x0 + pw * 0.92} y2={y0 + ph * (0.14 + i * 0.11)} stroke={role('ink')} strokeOpacity={0.25} strokeWidth={2 * k} />)}
						<line x1={x0 + pw * 0.62} y1={y0 + ph * 0.06} x2={x0 + pw * 0.62} y2={y0 + ph * 0.94} stroke={role('primary')} strokeOpacity={0.5} strokeWidth={2 * k} />
						<path d={`M ${x0 + pw * 0.66} ${y0 + ph * 0.5} q ${pw * 0.04} ${-ph * 0.08} ${pw * 0.07} 0 t ${pw * 0.07} 0 t ${pw * 0.07} 0`} fill="none" stroke={role('ink')} strokeWidth={6 * k} strokeLinecap="round" strokeDasharray={pw} strokeDashoffset={pw * (1 - pen)} />
						<ellipse cx={x0 + pw * 0.77} cy={y0 + ph * 0.49} rx={pw * 0.17} ry={ph * 0.09} fill="none" stroke={role('primary')} strokeWidth={7 * k} strokeDasharray={pw * 1.2} strokeDashoffset={pw * 1.2 * (1 - ring)} />
						<g transform={`translate(${x0 + pw * 0.25} ${y0 + ph * 0.8})`}>
							<rect x={-pw * 0.12} y={0} width={pw * 0.24} height={ph * 0.12} rx={6 * k} fill={role('primary')} />
							<path d={`M ${-pw * 0.07} 0 V ${-ph * 0.05} A ${pw * 0.07} ${pw * 0.07} 0 0 1 ${pw * 0.07} ${-ph * 0.05} V 0`} fill="none" stroke={role('primary')} strokeWidth={8 * k} />
						</g>
					</g>
				</svg>
			</div>
		);
	}
	if (kit.props.phase === 'left') {
		const rise = ease('settle', 0, 18), hold = ease('fade', 14, 20);
		return (
			<div style={{position: 'absolute', ...box}}>
				<svg width={W} height={H} style={{overflow: 'visible'}}>
					{[0, 1, 2, 3, 4].map((i) => {
						const x = W * (0.1 + i * 0.2), y = H * (0.72 - 0.06 * Math.sin(i * 1.3)) + (1 - rise) * H * 0.3;
						return (
							<g key={i}>
								<path d={`M ${x - 26 * k} ${H * 1.02} L ${x - 22 * k} ${y + 20 * k} Q ${x} ${y + 4 * k} ${x + 22 * k} ${y + 20 * k} L ${x + 26 * k} ${H * 1.02} Z`} fill={role('surface')} stroke={role('ink')} strokeWidth={4 * k} />
								<circle cx={x} cy={y - 40 * k} r={42 * k} fill="none" stroke={role('highlight')} strokeWidth={5 * k} strokeDasharray={`${10 * k} ${9 * k}`} opacity={0.35 + 0.65 * hold * (0.6 + 0.4 * Math.sin(f * 0.12 + i))} />
							</g>
						);
					})}
				</svg>
			</div>
		);
	}
	const tear = ease('tear', 4, 16), line = ease('draw', 18, Math.max(30, frames - 60)), fade = ease('fade', Math.round(frames * 0.62), 24);
	const A = {x: W * 0.12, y: H * 0.72}, B = {x: W * 0.86, y: H * 0.28}, C = {x: W * 0.55, y: H * 0.25};
	const at = (t: number) => ({x: (1 - t) ** 2 * A.x + 2 * (1 - t) * t * C.x + t * t * B.x, y: (1 - t) ** 2 * A.y + 2 * (1 - t) * t * C.y + t * t * B.y});
	const stop = Math.min(line, 0.78), p = at(stop);
	return (
		<div style={{position: 'absolute', ...box}}>
			<svg width={W} height={H} style={{overflow: 'visible'}}>
				{[0, 1].map((half) => (
					<g key={half} transform={`translate(${W * 0.06 + half * W * 0.24 + (half ? 1 : -1) * tear * W * 0.05} ${H * 0.02}) rotate(${(half ? 1 : -1) * tear * 7})`} opacity={1 - fade * 0.6}>
						<rect width={W * 0.24} height={H * 0.24} fill={role('surface')} stroke={role('ink')} strokeWidth={3 * k} />
						{[0, 1, 2].map((i) => <rect key={i} x={W * 0.03} y={H * (0.05 + i * 0.045)} width={W * (half ? 0.12 : 0.17)} height={H * 0.018} fill={role('ink')} opacity={0.6} />)}
					</g>
				))}
				<text x={B.x} y={B.y - H * 0.05} textAnchor="middle" style={{...font('mono', 52), fill: role('surface')}} opacity={0.9}>ATHENS</text>
				<circle cx={B.x} cy={B.y} r={10 * k} fill="none" stroke={role('surface')} strokeWidth={3 * k} />
				{Array.from({length: 40}).map((_, i) => { const t = (i / 40) * stop; const q = at(t); return <circle key={i} cx={q.x} cy={q.y} r={4 * k} fill={role('highlight')} opacity={0.3 + (1 - fade) * 0.6} />; })}
				<circle cx={p.x} cy={p.y} r={(14 + 26 * ((f % 30) / 30)) * k} fill="none" stroke={role('primary')} strokeWidth={4 * k} opacity={(1 - fade) * (1 - (f % 30) / 30)} />
				<circle cx={p.x} cy={p.y} r={12 * k} fill={role('primary')} opacity={1 - fade} />
			</svg>
		</div>
	);
};
