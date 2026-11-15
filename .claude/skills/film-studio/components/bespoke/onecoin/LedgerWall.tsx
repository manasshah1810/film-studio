import React from 'react';
import {type BespokeScene} from '../kit';

/**
 * s2 micro-explainer (and s3 with props.phase "dark"): one ledger page fans out into a wall of identical
 * copies held by many machines; a forged row appears and flashes red on EVERY copy, then each copy rejects it.
 * phase "dark": the public wall goes dark and one padlocked book is left while a hand writes numbers into it.
 */
const Page: React.FC<{x: number; y: number; w: number; h: number; ink: string; paper: string; red: string; forged: number; k: number}> = ({x, y, w, h, ink, paper, red, forged, k}) => (
	<g transform={`translate(${x} ${y})`}>
		<rect width={w} height={h} rx={4 * k} fill={paper} stroke={ink} strokeWidth={2.5 * k} />
		{[0, 1, 2, 3, 4].map((i) => <rect key={i} x={w * 0.12} y={h * (0.16 + i * 0.15)} width={w * (i % 2 ? 0.62 : 0.76)} height={h * 0.05} fill={ink} opacity={0.55} />)}
		<rect x={w * 0.06} y={h * 0.76} width={w * 0.88} height={h * 0.12} fill={red} opacity={forged} />
	</g>
);

export const LedgerWall: BespokeScene = ({kit}) => {
	const {frame: f, frames, box, role, ease, font, k} = kit;
	const W = box.width, H = box.height, dark = kit.props.phase === 'dark', hold = kit.props.phase === 'public-hold';
	const cols = 4, rows = 3, gw = W / cols, gh = H * 0.6 / rows, pw = gw * 0.72, ph = gh * 0.78;
	const forgeAt = typeof kit.props.forgeAt === 'number' ? (kit.props.forgeAt as number) : Math.round(frames * 0.55);
	const flash = dark || hold ? 0 : ease('draw', forgeAt, 8) * (0.55 + 0.45 * Math.abs(Math.sin((f - forgeAt) * 0.35)));
	const out = dark ? ease('fade', 0, 18) : 0;
	const book = dark ? ease('settle', 10, 16) : 0;
	const write = dark ? ease('draw', 26, Math.max(20, frames - 40)) : 0;
	return (
		<div style={{position: 'absolute', ...box}}>
			<svg width={W} height={H} style={{overflow: 'visible'}}>
				{Array.from({length: cols * rows}).map((_, i) => {
					const c = i % cols, r = Math.floor(i / cols), fan = dark ? 1 : ease('settle', 4 + i * 3, 14);
					const x = W / 2 - pw / 2 + (c * gw + (gw - pw) / 2 - (W / 2 - pw / 2)) * fan, y = H * 0.04 + (r * gh) * fan + (1 - fan) * gh;
					return <g key={i} opacity={(fan > 0.02 ? 1 : 0) * (1 - out * 0.88)}><Page x={x} y={y} w={pw} h={ph} ink={role('ink')} paper={role('surface')} red={role('primary')} forged={flash} k={k} /></g>;
				})}
				{!dark && !hold && f > forgeAt + 10 ? (
					<g opacity={ease('settle', forgeAt + 10, 10)} transform={`rotate(-5 ${W / 2} ${H * 0.82})`}>
						<rect x={W * 0.2} y={H * 0.71} width={W * 0.6} height={H * 0.2} fill="none" stroke={role('primary')} strokeWidth={7 * k} />
						<text x={W / 2} y={H * 0.86} textAnchor="middle" style={{...font('display', 92), fill: role('primary')}}>REJECTED</text>
					</g>
				) : null}
				{dark ? (
					<g transform={`translate(${W / 2} ${H * 0.52}) scale(${(0.6 + 0.4 * book).toFixed(3)})`} opacity={book}>
						<rect x={-W * 0.24} y={-H * 0.3} width={W * 0.48} height={H * 0.6} rx={10 * k} fill={role('surface')} stroke={role('ink')} strokeWidth={6 * k} />
						<line x1={0} y1={-H * 0.3} x2={0} y2={H * 0.3} stroke={role('ink')} strokeWidth={4 * k} />
						{[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={W * 0.03} y={-H * 0.22 + i * H * 0.07} width={W * 0.17 * Math.max(0, Math.min(1, write * 6 - i))} height={H * 0.022} fill={role('ink')} />)}
						<g transform={`translate(${-W * 0.12} ${-H * 0.02})`}>
							<rect x={-W * 0.06} y={0} width={W * 0.12} height={H * 0.11} rx={6 * k} fill={role('primary')} />
							<path d={`M ${-W * 0.035} 0 V ${-H * 0.05} A ${W * 0.035} ${W * 0.035} 0 0 1 ${W * 0.035} ${-H * 0.05} V 0`} fill="none" stroke={role('primary')} strokeWidth={8 * k} />
						</g>
						<g transform={`translate(${W * 0.03 + W * 0.17 * Math.min(1, write * 6 - Math.floor(write * 6))} ${-H * 0.22 + Math.min(5, Math.floor(write * 6)) * H * 0.07 - H * 0.06}) rotate(30)`}>
							<rect x={-6 * k} y={-H * 0.12} width={12 * k} height={H * 0.12} fill={role('highlight')} stroke={role('ink')} strokeWidth={2 * k} />
						</g>
						<text x={-W * 0.12} y={H * 0.25} textAnchor="middle" style={{...font('mono', 30), fill: role('primary')}}>PRIVATE</text>
						{kit.props.ghost ? [0, 1, 2, 3, 4].map((i) => { const g = ease('settle', 4 + i * 6, 20); return <circle key={i} cx={W * (0.08 + i * 0.05)} cy={-H * 0.1 - g * H * (0.18 + (i % 2) * 0.06)} r={W * 0.035} fill="none" stroke={role('highlight')} strokeWidth={5 * k} strokeDasharray={`${8 * k} ${6 * k}`} opacity={g * (1 - ease('fade', 30 + i * 6, 20))} />; }) : null}
					</g>
				) : null}
			</svg>
		</div>
	);
};
