import React from 'react';
import {type BespokeScene} from '../kit';

/** s6: a flight path draws from Sofia to Athens; the plane's radar ping fades out before it lands. Signal lost. */
export const FlightVanish: BespokeScene = ({kit}) => {
	const {frame: f, box, role, font, ease} = kit;
	const W = box.width, H = box.height;
	const A = {x: W * 0.2, y: H * 0.16}, B = {x: W * 0.72, y: H * 0.84}, C = {x: W * 0.92, y: H * 0.3};
	const at = (t: number) => ({x: (1 - t) ** 2 * A.x + 2 * (1 - t) * t * C.x + t * t * B.x, y: (1 - t) ** 2 * A.y + 2 * (1 - t) * t * C.y + t * t * B.y});
	const lostAt = Number(kit.props.lostAt ?? 0.68);
	const t = Math.min(lostAt, ease('drift', 10, 90) * 0.95);
	const gone = Math.max(0, Math.min(1, (f - 82) / 14));
	const p = at(t), q = at(Math.min(1, t + 0.01));
	const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
	const pts = Array.from({length: 41}).map((_, i) => at((i / 40) * t)).map((o) => `${o.x},${o.y}`).join(' ');
	const rest = Array.from({length: 21}).map((_, i) => at(t + (i / 20) * (1 - t))).map((o) => `${o.x},${o.y}`).join(' ');
	const ping = (f % 24) / 24;
	const label = (txt: string, o: {x: number; y: number}, dx: number) => (
		<div style={{position: 'absolute', left: o.x + dx, top: o.y - 28, ...font('mono', 40), color: role('ink'), opacity: ease('draw', 0, 12)}}>{txt}</div>
	);
	return (
		<div style={{position: 'absolute', ...box}}>
			<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{overflow: 'visible'}}>
				{Array.from({length: 7}).map((_, i) => <line key={`g${i}`} x1={(W * i) / 6} y1={0} x2={(W * i) / 6} y2={H} stroke={role('ink')} strokeOpacity={0.07} strokeWidth={2} />)}
				{Array.from({length: 9}).map((_, i) => <line key={`h${i}`} x1={0} y1={(H * i) / 8} x2={W} y2={(H * i) / 8} stroke={role('ink')} strokeOpacity={0.07} strokeWidth={2} />)}
				<polyline points={rest} fill="none" stroke={role('ink')} strokeOpacity={0.25} strokeWidth={4} strokeDasharray="4 18" strokeLinecap="round" />
				<polyline points={pts} fill="none" stroke={role('primary')} strokeWidth={7} strokeLinecap="round" opacity={1 - gone * 0.5} />
				<circle cx={A.x} cy={A.y} r={16} fill={role('primary')} />
				<circle cx={B.x} cy={B.y} r={16} fill="none" stroke={role('highlight')} strokeWidth={5} />
				<circle cx={B.x} cy={B.y} r={16 + 30 * ((f % 30) / 30)} fill="none" stroke={role('highlight')} strokeWidth={3} opacity={(1 - (f % 30) / 30) * gone} />
				<g opacity={1 - gone} transform={`translate(${p.x} ${p.y}) rotate(${ang})`}>
					<circle r={20 + ping * 70} fill="none" stroke={role('primary')} strokeWidth={3} opacity={1 - ping} />
					<polygon points="30,0 -18,-18 -8,0 -18,18" fill={role('ink')} />
				</g>
			</svg>
			{label(String(kit.props.from ?? 'SOFIA'), A, 34)}
			{label(String(kit.props.to ?? 'ATHENS'), B, -260)}
		</div>
	);
};
