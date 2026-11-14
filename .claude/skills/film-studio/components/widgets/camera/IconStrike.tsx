import React from 'react';
import {boxPx, boxStyle, enterP, popP, txt} from '../social/tokens';
import {drawP, lab} from '../data/tokens';
import {Card, Label} from './parts';
import {shakeAt, type CameraBase} from './tokens';

/**
 * 40 IconStrike. A line icon pops in, then a ring and a slash draw over it in the strike colour; a surface-coloured
 * band under the slash cuts the icon, so the strike reads as a cut, not a scribble. The card shakes once, the icon
 * dims and the verdict line rises. Icons are drawn in a 100 x 100 box with the style's line weight.
 */
export type IconId = 'camera' | 'film' | 'mic' | 'bell' | 'play' | 'heart';
export type IconStrikeProps = CameraBase & {icon: IconId; label: string; name: string; verdict: string; strikeAt?: number; seed: string};
export const ICON_STRIKE = {frames: 72, hero: 66, sfx: [{at: 4, id: 'tactile-pop'}, {at: 'strikeAt', id: 'pen-scratch'}, {at: 'strikeAt + 12', id: 'sub-bass-hit'}]};

const ICONS: Record<IconId, string> = {
	camera: 'M14,34 H34 L40,24 H60 L66,34 H86 V78 H14 Z M50,44 a12,12 0 1,0 0.01,0 Z',
	film: 'M18,18 H82 V82 H18 Z M30,18 V82 M70,18 V82 M18,34 H30 M18,50 H30 M18,66 H30 M70,34 H82 M70,50 H82 M70,66 H82',
	mic: 'M38,22 a12,12 0 0,1 24,0 V50 a12,12 0 0,1 -24,0 Z M28,48 a22,22 0 0,0 44,0 M50,70 V84 M38,84 H62',
	bell: 'M30,68 V46 a20,20 0 0,1 40,0 V68 L78,76 H22 Z M44,80 a6,6 0 0,0 12,0 M50,20 V26',
	play: 'M20,20 H80 V80 H20 Z M42,36 L64,50 L42,64 Z',
	heart: 'M50,80 L22,52 a16,16 0 0,1 28,-24 a16,16 0 0,1 28,24 Z',
};

export const IconStrike: React.FC<IconStrikeProps> = ({tk, frame: f, box, icon, label, name, verdict, strikeAt = 20}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const pad = 52;
	const head = pad + lab(tk, 0.82) * 1.4 + 24;
	const foot = tk.size.h2 * 1.3 + tk.size.body * 1.4 + 60;
	const area = H - head - foot - pad;
	const S = Math.min(W - pad * 2, area) * 0.86;
	const pop = popP(tk, f, 4);
	const ring = drawP(tk, f, strikeAt, 12);
	const slash = drawP(tk, f, strikeAt + 8, 8);
	const hit = strikeAt + 16;
	const sh = shakeAt([10, -8, 5, -2, 0], f, hit);
	const dim = f >= hit ? 0.42 : 1;
	const ver = enterP(tk, f, hit + 6, 12);
	const k = S / 100;
	const lw = Math.max(tk.stroke.line, 6) / k;
	const sw = lw * 1.8;
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translate(${sh}px, ${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between'}}>
					<Label tk={tk}>{label}</Label>
					<Label tk={tk} color={f >= hit ? tk.accent : tk.label}>{f >= hit ? 'CUT' : 'KEEP?'}</Label>
				</div>
				<svg width={S} height={S} viewBox="0 0 100 100" style={{position: 'absolute', left: (W - S) / 2, top: head + (area - S) / 2, overflow: 'visible'}}>
					<g transform={`translate(50 50) scale(${pop * 0.62}) translate(-50 -50)`} opacity={dim}>
						<path d={ICONS[icon]} fill="none" stroke={tk.text} strokeWidth={lw / 0.62} strokeLinecap="round" strokeLinejoin="round" />
					</g>
					{slash > 0 && <line x1={18} y1={18} x2={18 + 64 * slash} y2={18 + 64 * slash} stroke={tk.c.surface} strokeWidth={sw * 2.6} strokeLinecap="round" />}
					<g style={{filter: tk.glow(tk.strike)}}>
						<circle cx={50} cy={50} r={45} fill="none" stroke={tk.strike} strokeWidth={sw} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring} transform="rotate(-135 50 50)" strokeLinecap="round" opacity={ring > 0 ? 1 : 0} />
						{slash > 0 && <line x1={18} y1={18} x2={18 + 64 * slash} y2={18 + 64 * slash} stroke={tk.strike} strokeWidth={sw} strokeLinecap="round" />}
					</g>
				</svg>
				<div style={{position: 'absolute', left: pad, right: pad, top: head + area + 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
					<span style={{...txt(tk, 'display', tk.size.h2, tk.text), textDecoration: f >= hit ? 'line-through' : 'none', textDecorationColor: tk.strike, textDecorationThickness: Math.max(4, tk.stroke.line)}}>{name}</span>
					<span style={{...txt(tk, 'body', tk.size.body, tk.accent), opacity: ver, transform: `translateY(${(1 - ver) * 18}px)`, whiteSpace: 'normal', textAlign: 'center'}}>{verdict}</span>
				</div>
			</Card>
		</div>
	);
};
