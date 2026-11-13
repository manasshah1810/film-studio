import React from 'react';
import {useD} from './tokens';

/** Backdrop and finish helpers shared by kits. Colours are passed in already resolved from roles. */
export const Halftone: React.FC<{id: string; color: string; cell: number; r?: number; opacity?: number; angle?: number; mask?: string; style?: React.CSSProperties}> = ({id, color, cell, r = 0.32, opacity = 1, angle = 45, mask, style}) => (
	<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity, WebkitMaskImage: mask, maskImage: mask, pointerEvents: 'none', ...style}}>
		<pattern id={id} patternUnits="userSpaceOnUse" width={cell} height={cell} patternTransform={`rotate(${angle})`}>
			<circle cx={cell / 2} cy={cell / 2} r={cell * r} fill={color} />
		</pattern>
		<rect width="100%" height="100%" fill={`url(#${id})`} />
	</svg>
);
export const Vignette: React.FC<{color: string; inner?: number; strength?: number}> = ({color, inner = 45, strength = 1}) => (
	<div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 46%, transparent ${inner}%, ${color} 130%)`, opacity: strength, pointerEvents: 'none'}} />
);
export const Scanlines: React.FC<{color: string; gap: number; opacity: number}> = ({color, gap, opacity}) => (
	<div style={{position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(0deg, ${color} 0, ${color} ${gap / 2}px, transparent ${gap / 2}px, transparent ${gap}px)`, opacity, pointerEvents: 'none'}} />
);
/** Sunburst wedges from a point. */
export const Rays: React.FC<{cx: number; cy: number; color: string; n?: number; opacity?: number; rot?: number}> = ({cx, cy, color, n = 14, opacity = 1, rot = 0}) => {
	const {W, H} = useD();
	const R = Math.hypot(W, H);
	return (
		<svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity}}>
			{Array.from({length: n}, (_, i) => {
				const a = ((i * 2) / (n * 2)) * Math.PI * 2 + (rot * Math.PI) / 180, b = a + Math.PI / n;
				return <path key={i} d={`M${cx} ${cy}L${cx + Math.cos(a) * R} ${cy + Math.sin(a) * R}L${cx + Math.cos(b) * R} ${cy + Math.sin(b) * R}Z`} fill={color} />;
			})}
		</svg>
	);
};
/** Lines converging on a point (comic speed lines); the centre is left clear. */
export const SpeedLines: React.FC<{cx: number; cy: number; color: string; n?: number; clear?: number; seed: (i: number) => number; opacity?: number}> = ({cx, cy, color, n = 46, clear = 0.36, seed, opacity = 1}) => {
	const {W, H} = useD();
	const R = Math.hypot(W, H);
	return (
		<svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity}}>
			{Array.from({length: n}, (_, i) => {
				const a = ((i + seed(i) * 0.8) / n) * Math.PI * 2, w = 0.004 + seed(i + 99) * 0.014, r0 = R * (clear + seed(i + 7) * 0.16);
				return <path key={i} d={`M${cx + Math.cos(a) * r0} ${cy + Math.sin(a) * r0}L${cx + Math.cos(a - w) * R} ${cy + Math.sin(a - w) * R}L${cx + Math.cos(a + w) * R} ${cy + Math.sin(a + w) * R}Z`} fill={color} />;
			})}
		</svg>
	);
};
/** SVG filter defs used by several kits. Render once per panel, reference by url(#id). */
export const Filters: React.FC<{id: string; kind: 'wet' | 'rough' | 'paper' | 'glow'; scale?: number; freq?: number; blur?: number}> = ({id, kind, scale = 6, freq = 0.03, blur = 0.6}) => (
	<svg width={0} height={0} style={{position: 'absolute'}}>
		<filter id={id} x="-20%" y="-20%" width="140%" height="140%">
			{kind === 'glow' ? (
				<>
					<feGaussianBlur stdDeviation={blur} result="b" />
					<feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
				</>
			) : kind === 'paper' ? (
				<>
					<feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={3} seed={7} result="n" />
					<feDiffuseLighting in="n" lightingColor="#fff" surfaceScale={scale} result="l"><feDistantLight azimuth={45} elevation={62} /></feDiffuseLighting>
					<feComposite in="l" in2="SourceGraphic" operator="in" result="lit" />
					<feBlend in="SourceGraphic" in2="lit" mode="multiply" />
				</>
			) : (
				<>
					<feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={kind === 'wet' ? 3 : 2} seed={4} result="n" />
					<feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="G" result="d" />
					{kind === 'wet' ? <feGaussianBlur in="d" stdDeviation={blur} /> : null}
				</>
			)}
		</filter>
	</svg>
);
