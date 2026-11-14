import React from 'react';
import {random} from 'remotion';
import {boxPx, boxStyle, enterP, moveP, popP, txt} from '../social/tokens';
import {TAB, lab} from '../data/tokens';
import {Card, Label, Scene, SPOT, Viewport, sceneColors} from './parts';
import {type CameraBase} from './tokens';

/**
 * 38 EyedropperGrade. A ring cursor visits three points of the shot (the sun, the coat, the foreground) and samples
 * each: the ring fills with the sampled colour, a swatch lands in the footer and its hex decodes from scrambled
 * characters to the true value, in tabular mono. The sampled values are the palette colours the shot is drawn with.
 */
export type EyedropperGradeProps = CameraBase & {label: string; names?: [string, string, string]; at?: number; each?: number; seed: string};
export const EYEDROPPER_GRADE = {frames: 110, hero: 104, sfx: [{at: 'at + i * each + 18', id: 'click-soft'}, {at: 'decode', id: 'digital-tick'}]};

const HEX = '0123456789ABCDEF';

export const EyedropperGrade: React.FC<EyedropperGradeProps> = ({tk, frame: f, box, label, names = ['KEY LIGHT', 'COAT', 'TOWER'], at = 10, each = 28, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const pad = 52;
	const head = pad + lab(tk, 0.82) * 1.4 + 24;
	const rowH = Math.max(tk.size.body, lab(tk, 0.82)) + 26;
	const foot = rowH * 3 + 40;
	const vw = W - pad * 2, vh = H - head - foot - pad;
	const C = sceneColors(tk);
	const S = SPOT.subject;
	const pts = [
		{x: SPOT.sun.x, y: SPOT.sun.y, hex: C.sun},
		{x: S.x + 0.02, y: S.top + (S.feet - S.top) * 0.45, hex: C.coat},
		{x: 0.703, y: 0.56, hex: C.mid},
	];
	const home = {x: 0.5, y: 0.5};
	let cur = home;
	let n = -1;
	pts.forEach((p, i) => {
		const t0 = at + i * each;
		const m = moveP(tk, f, t0, 16);
		if (f >= t0) {
			const prev = i === 0 ? home : pts[i - 1];
			cur = {x: prev.x + (p.x - prev.x) * m, y: prev.y + (p.y - prev.y) * m};
			if (m >= 1) n = i;
		}
	});
	const R = Math.min(vw, vh) * 0.07;
	const cx = cur.x * vw, cy = cur.y * vh;
	const hexAt = (hex: string, i: number) => {
		const t = f - (at + i * each + 16);
		const settled = Math.floor(t / 2);
		return `#${hex.replace('#', '').toUpperCase().split('').map((ch, k) => (k < settled ? ch : HEX[Math.floor(random(`${seed}-${i}-${k}-${f}`) * 16)])).join('')}`;
	};
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between'}}>
					<Label tk={tk}>{label}</Label>
					<Label tk={tk} color={tk.accent}>{`SAMPLE ${Math.max(0, n + 1)}/3`}</Label>
				</div>
				<Viewport tk={tk} x={pad} y={head} w={vw} h={vh}>
					<Scene tk={tk} w={vw} h={vh} seed={seed} />
					<svg width={vw} height={vh} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: Math.min(1, enterP(tk, f, at - 6, 8))}}>
						<circle cx={cx} cy={cy} r={R + tk.stroke.line * 2} fill="none" stroke={tk.c.surface} strokeWidth={tk.stroke.line * 2} />
						<circle cx={cx} cy={cy} r={R} fill={n >= 0 && f >= at + n * each + 16 ? pts[n].hex : 'none'} stroke={tk.text} strokeWidth={tk.stroke.line} />
						<line x1={cx} y1={cy - R * 0.35} x2={cx} y2={cy + R * 0.35} stroke={tk.text} strokeWidth={tk.stroke.hair} />
						<line x1={cx - R * 0.35} y1={cy} x2={cx + R * 0.35} y2={cy} stroke={tk.text} strokeWidth={tk.stroke.hair} />
						<path d={`M${cx + R * 0.72},${cy + R * 0.72} L${cx + R * 1.9},${cy + R * 1.9}`} stroke={tk.text} strokeWidth={tk.stroke.line * 1.6} strokeLinecap="round" />
					</svg>
				</Viewport>
				<div style={{position: 'absolute', left: pad, right: pad, top: head + vh + 30, display: 'flex', flexDirection: 'column', gap: 0}}>
					{pts.map((p, i) => {
						const t0 = at + i * each + 16;
						const pop = popP(tk, f, t0);
						const has = f >= t0;
						return (
							<div key={i} style={{height: rowH, display: 'flex', alignItems: 'center', gap: 22, borderBottom: i < 2 ? `${tk.stroke.hair}px solid ${tk.grid}` : 'none'}}>
								<div style={{width: rowH - 22, height: rowH - 22, flex: 'none', borderRadius: Math.min(tk.plateR, 10), background: has ? p.hex : 'transparent', border: `${tk.stroke.hair}px solid ${tk.grid}`, transform: `scale(${has ? pop : 1})`}} />
								<Label tk={tk} color={has ? tk.text : tk.label} style={{flex: 1}}>{names[i]}</Label>
								<span style={{...txt(tk, 'mono', Math.max(tk.size.body * 0.9, tk.labelMin), has ? tk.accent : tk.label), ...TAB}}>{has ? hexAt(p.hex, i) : '#------'}</span>
							</div>
						);
					})}
				</div>
			</Card>
		</div>
	);
};
