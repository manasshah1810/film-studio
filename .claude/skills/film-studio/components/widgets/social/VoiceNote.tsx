import React from 'react';
import {Glyph} from './parts';
import {boxPx, boxStyle, card, lin, popP, seeded, txt, type WidgetBase} from './tokens';

/** 03 VoiceNote. A voice bubble pops in, the play button is tapped, the waveform fills and the timer runs. */
export type VoiceNoteProps = WidgetBase & {seconds: number; seed: string; playAt?: number; bars?: number};
export const VOICE_NOTE = {frames: 90, hero: 62, sfx: [{at: 'playAt', id: 'click-soft'}]};

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export const VoiceNote: React.FC<VoiceNoteProps> = ({tk, frame: f, box, seconds, seed, playAt = 14, bars = 34}) => {
	const {width: W, height: H} = boxPx(box);
	const p = popP(tk, f, 0);
	const playing = f >= playAt;
	const elapsed = Math.max(0, Math.min(seconds, (f - playAt) / 30));
	const prog = elapsed / seconds;
	const press = lin(f, playAt, playAt + 3) - lin(f, playAt + 3, playAt + 8);
	const pad = 32, btn = 120;
	const waveW = W - pad * 2 - btn - 28;
	const step = waveW / bars;
	const waveH = 110;
	return (
		<div style={{...boxStyle(box), overflow: 'visible'}}>
			<div style={{...card(tk), position: 'absolute', left: 0, top: 0, width: W, height: H, padding: pad, display: 'flex', alignItems: 'center', gap: 28, transform: `scale(${0.6 + 0.4 * p})`, transformOrigin: '0% 100%', opacity: Math.min(1, p * 1.5), borderBottomLeftRadius: Math.min(tk.radius, 8)}}>
				<div style={{...card(tk, 'primary', btn / 2, 1 - press), width: btn, height: btn, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 - press * 0.08})`}}>
					<Glyph id={playing && prog < 1 ? 'pause' : 'play'} size={54} color={tk.on('primary').hex} />
				</div>
				<div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 10}}>
					<svg width={waveW} height={waveH} style={{display: 'block'}}>
						{Array.from({length: bars}, (_, i) => {
							const base = seeded(`${seed}-${i}`, 0.22, 1);
							const passed = (i + 0.5) / bars <= prog;
							const near = playing && prog < 1 ? Math.max(0, 1 - Math.abs((i + 0.5) / bars - prog) * bars * 0.35) : 0;
							const h = Math.max(10, waveH * base * (0.8 + 0.2 * near * Math.abs(Math.sin(f * 0.9 + i))));
							return <rect key={i} x={i * step + step * 0.2} y={(waveH - h) / 2} width={step * 0.6} height={h} rx={step * 0.3} fill={passed ? tk.c.primary : tk.line} />;
						})}
					</svg>
					<span style={{...txt(tk, 'mono', tk.size.label, tk.c.ink), alignSelf: 'flex-end'}}>{playing ? mmss(elapsed) : mmss(seconds)}</span>
				</div>
			</div>
		</div>
	);
};
