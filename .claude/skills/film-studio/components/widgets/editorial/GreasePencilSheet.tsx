import React, {useId} from 'react';
import {boxPx, boxStyle, enterP, lin, moveP, txt} from '../social/tokens';
import {Halftone, Paper, type Subject} from './parts';
import {jit, type EditorialBase} from './tokens';

/** 18 GreasePencilSheet. A photo editor's grease pencil marks a print: four crop corners, the rest dims, a note and arrow. */
export type GreasePencilSheetProps = EditorialBase & {subject?: Subject; crop: {x: number; y: number; w: number; h: number}; note: string; label: string; drawAt?: number; seed: string};
export const GREASE_PENCIL_SHEET = {frames: 90, hero: 80, sfx: [{at: 'drawAt + i * 6', id: 'marker-stroke'}, {at: 'drawAt + 34', id: 'pen-scratch'}]};

export const GreasePencilSheet: React.FC<GreasePencilSheetProps> = ({tk, frame: f, box, subject = 'skyline', crop, note, label, drawAt = 18, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const id = `w${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
	const inn = enterP(tk, f, 0, 12);
	const b = 40, foot = 150;
	const iw = W - b * 2, ih = H - b - foot;
	const c = {x: crop.x * iw, y: crop.y * ih, w: crop.w * iw, h: crop.h * ih};
	const arm = Math.min(c.w, c.h) * 0.28;
	const gw = tk.pen.w * 2.4;
	const corner = (k: number) => {
		const [x, y] = [k % 3 === 0 ? c.x : c.x + c.w, k < 2 ? c.y : c.y + c.h];
		const sx = k % 3 === 0 ? 1 : -1, sy = k < 2 ? 1 : -1;
		return `M${x + sx * arm} ${y} L${x} ${y} L${x} ${y + sy * arm}`;
	};
	const dim = lin(f, drawAt + 24, drawAt + 34) * 0.5;
	const arrow = (f - drawAt - 32) / 10;
	const write = moveP(tk, f, drawAt + 38, 14);
	return (
		<div style={{...boxStyle(box), overflow: 'visible', opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 60}px) rotate(-1deg)`}}>
			<Paper tk={tk} w={W} h={H} seed={seed} torn={false}>
				<div style={{position: 'absolute', left: b, top: b, width: iw, height: ih, outline: `${tk.rule.thin}px solid ${tk.line}`}}>
					<Halftone tk={tk} w={iw} h={ih} subject={subject} seed={seed} pitch={13} grow={moveP(tk, f, 4, 18)} />
					<svg width={iw} height={ih} style={{position: 'absolute', left: 0, top: 0}}>
						<path d={`M0 0 H${iw} V${ih} H0 Z M${c.x} ${c.y} V${c.y + c.h} H${c.x + c.w} V${c.y} Z`} fill={tk.c.surface} fillRule="evenodd" opacity={dim * 1.3} />
					</svg>
				</div>
				<span style={{position: 'absolute', left: b, bottom: foot - 62, ...txt(tk, 'mono', tk.size.label * 0.78, tk.text)}}>{label}</span>
				<span style={{position: 'absolute', right: b + 10, bottom: 22, ...txt(tk, 'accent', tk.size.h2 * 1.05, tk.pen.hex), overflow: 'visible', clipPath: `inset(-20% ${(1 - write) * 100}% -20% -5%)`, transform: jit(tk, f, `${seed}n`)}}>{note}</span>
			</Paper>
			<svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
				<filter id={id} x="-10%" y="-10%" width="120%" height="120%">
					<feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={2} seed={4} result="n" />
					<feDisplacementMap in="SourceGraphic" in2="n" scale={4} result="d" />
					<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -7 0 0 0 4.9" result="m" />
					<feComposite in="d" in2="m" operator="in" />
				</filter>
				<g transform={`translate(${b} ${b})`} filter={`url(#${id})`} fill="none" stroke={tk.pen.hex} strokeWidth={gw} strokeLinecap="round" strokeLinejoin="round">
					{[0, 1, 2, 3].map((k) => (
						<path key={k} d={corner(k)} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.max(0, Math.min(1, (f - drawAt - k * 6) / 6))} />
					))}
					<path d={`M${iw - 360} ${ih + foot - 64} C ${iw - 400} ${ih + 30}, ${c.x + c.w * 0.7} ${c.y + c.h + 70}, ${c.x + c.w * 0.62} ${c.y + c.h + 16} M${c.x + c.w * 0.62 - 20} ${c.y + c.h + 40} L${c.x + c.w * 0.62} ${c.y + c.h + 14} L${c.x + c.w * 0.62 + 26} ${c.y + c.h + 32}`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.max(0, Math.min(1, arrow))} strokeWidth={gw * 0.6} />
				</g>
			</svg>
		</div>
	);
};
