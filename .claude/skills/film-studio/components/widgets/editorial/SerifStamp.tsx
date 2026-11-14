import React, {useId} from 'react';
import {random} from 'remotion';
import {boxPx, boxStyle, enterP, lin, popP, txt} from '../social/tokens';
import {Paper} from './parts';
import {jit, type EditorialBase} from './tokens';

/** 15 SerifStamp. A rubber stamp slams onto a file: oversize to 1 on the stamp spring, the paper jolts, ink drops out. */
export type SerifStampProps = EditorialBase & {word: string; sub?: string; title: string; meta: string; sign: string; stampAt?: number; tilt?: number; seed: string};
export const SERIF_STAMP = {frames: 90, hero: 60, sfx: [{at: 'stampAt + 4', id: 'sub-bass-hit'}]};

export const SerifStamp: React.FC<SerifStampProps> = ({tk, frame: f, box, word, sub, title, meta, sign, stampAt = 30, tilt = -8, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const id = `s${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
	const inn = enterP(tk, f, 0, 14);
	const p = popP({...tk, spring: tk.stamp.spring}, f, stampAt);
	const hit = stampAt + 4;
	const jolt = f >= hit ? Math.sin((f - hit) * 1.9) * 7 * Math.exp(-(f - hit) / 4) : 0;
	const pad = 60;
	const sw = W * 0.74, sh = sw * (sub ? 0.36 : 0.3);
	const fSize = tk.size.label;
	const fd = tk.font.display;
	return (
		<div style={{...boxStyle(box), overflow: 'visible', opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 60 + jolt}px) rotate(0.8deg)`}}>
			<Paper tk={tk} w={W} h={H} seed={seed}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad + 10, display: 'flex', flexDirection: 'column', gap: 18}}>
					<span style={txt(tk, 'display', tk.size.h2, tk.text)}>{title}</span>
					<span style={{...txt(tk, 'mono', fSize * 0.8, tk.text), borderBottom: `${tk.rule.thin}px solid ${tk.text}`, paddingBottom: 14}}>{meta}</span>
					{Array.from({length: 9}).map((_, i) => (
						<div key={i} style={{height: 11, marginTop: 10, background: tk.line, width: `${(i === 8 ? 0.5 : 0.82 + random(`${seed}l${i}`) * 0.18) * 100}%`}} />
					))}
				</div>
				<div style={{position: 'absolute', left: pad, bottom: pad, display: 'flex', flexDirection: 'column', gap: 6}}>
					<span style={{...txt(tk, 'accent', tk.size.h2 * 0.9, tk.text), overflow: 'visible', textTransform: 'none'}}>{sign}</span>
					<div style={{width: 300, height: tk.rule.thin, background: tk.text}} />
				</div>
			</Paper>
			{f >= stampAt ? (
				<svg width={sw} height={sh} viewBox={`0 0 ${sw} ${sh}`} style={{position: 'absolute', left: (W - sw) / 2, top: H * 0.5 - sh / 2, overflow: 'visible', opacity: lin(f, stampAt, stampAt + 2) * 0.94, mixBlendMode: tk.marker.blend === 'multiply' ? 'multiply' : 'normal', transform: `rotate(${tilt}deg) scale(${1 + Math.max(-0.08, 1 - p) * 1.3}) ${jit(tk, f, `${seed}s`)}`}}>
					<filter id={id} x="-5%" y="-5%" width="110%" height="110%">
						<feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={Math.floor(random(seed) * 90)} result="n1" />
						<feColorMatrix in="n1" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -10 0 0 0 6.6" result="m1" />
						<feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves={1} seed={7} result="n2" />
						<feColorMatrix in="n2" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -14 0 0 0 9.6" result="m2" />
						<feComposite in="m1" in2="m2" operator="in" result="m" />
						<feComposite in="SourceGraphic" in2="m" operator="in" />
					</filter>
					<g filter={`url(#${id})`} fill="none" stroke={tk.stamp.hex}>
						<rect x={4} y={4} width={sw - 8} height={sh - 8} strokeWidth={9} rx={Math.min(tk.radius, 18)} />
						<rect x={20} y={20} width={sw - 40} height={sh - 40} strokeWidth={3} rx={Math.min(tk.radius, 12)} />
						<text x={sw / 2} y={sub ? sh * 0.55 : sh * 0.66} textAnchor="middle" textLength={sw - 90} lengthAdjust="spacingAndGlyphs" fill={tk.stamp.hex} stroke="none" style={{fontFamily: `"${fd.family}"`, fontWeight: fd.weight, fontSize: sh * (sub ? 0.4 : 0.5), textTransform: 'uppercase'}}>
							{word.toUpperCase()}
						</text>
						{sub ? (
							<text x={sw / 2} y={sh * 0.8} textAnchor="middle" fill={tk.stamp.hex} stroke="none" style={{fontFamily: `"${tk.font.mono.family}"`, fontWeight: 700, fontSize: sh * 0.12, letterSpacing: 4}}>
								{sub.toUpperCase()}
							</text>
						) : null}
					</g>
				</svg>
			) : null}
		</div>
	);
};
