import React from 'react';
import {boxPx, boxStyle, enterP, popP, txt} from '../social/tokens';
import {lab} from '../data/tokens';
import {mix} from '../camera/tokens';
import {Card, Label, frameOf} from './parts';
import {breakLines, fitSize, type KineticBase} from './tokens';

/**
 * 41 HeadStack. Two to five small heads (head only), each with its own hair silhouette and one brow, pop into a row
 * 4 frames apart. At `speakAt` one head speaks: its collar takes the series colour, it tilts and looks up, and its
 * line appears word by word under the row, broken with no orphan word. A tally line closes it. Use for groups,
 * opinions, surveys, "most people think".
 */
export type HeadStackProps = KineticBase & {label: string; heads: string[]; speaker?: number; quote: string; tally?: string; speakAt?: number; seed: string};
export const HEAD_STACK = {frames: 84, hero: 76, sfx: [{at: 0, id: 'tactile-pop'}, {at: 'speakAt', id: 'notification-ping'}]};

/** Five hair silhouettes in a 100 x 100 head box: back layer (behind the face) and front layer (fringe). */
const HAIR: {back?: string; front: string}[] = [
	{back: 'M50,4 a11,11 0 1,1 -0.01,0 Z', front: 'M23,47 C22,24 36,17 50,17 C64,17 78,24 77,47 C70,33 60,29 50,29 C40,29 30,33 23,47 Z'},
	{front: 'M23,45 C23,21 38,15 52,16 C68,17 78,27 77,45 C72,36 64,30 54,32 C46,26 32,30 23,45 Z'},
	{back: 'M20,50 C18,20 36,13 50,13 C64,13 82,20 80,50 L82,86 L68,86 L70,48 L30,48 L32,86 L18,86 Z', front: 'M24,46 C24,24 36,18 50,18 C64,18 76,24 76,46 C66,30 44,28 24,46 Z'},
	{front: 'M22,46 a9,9 0 0,1 6,-16 a10,10 0 0,1 14,-10 a10,10 0 0,1 16,0 a10,10 0 0,1 14,10 a9,9 0 0,1 6,16 C66,34 34,34 22,46 Z'},
	{front: 'M23,47 C21,22 40,14 56,17 C70,20 79,30 77,46 C68,40 50,38 38,26 C34,34 30,40 23,47 Z'},
];

const Head: React.FC<{tk: KineticBase['tk']; size: number; hair: number; speak: boolean; look: number; brow: number}> = ({tk, size, hair, speak, look, brow}) => {
	const H = HAIR[hair % HAIR.length];
	const skin = mix(tk.c.surface, tk.text, 0.12);
	const sw = Math.max(2.4, (tk.stroke.line * 100) / size / 1.6);
	const collar = speak ? tk.series[0] : tk.grid;
	const ey = 50 - look * 3;
	return (
		<svg width={size} height={size} viewBox="0 0 100 100" style={{overflow: 'visible', display: 'block'}}>
			<path d="M24,100 C24,82 36,76 50,76 C64,76 76,82 76,100 Z" fill={collar} />
			{H.back && <path d={H.back} fill={tk.text} />}
			<circle cx={50} cy={48} r={26} fill={skin} stroke={tk.text} strokeWidth={sw} />
			<path d={H.front} fill={tk.text} />
			<circle cx={41} cy={ey} r={2.8} fill={tk.text} />
			<circle cx={59} cy={ey} r={2.8} fill={tk.text} />
			<path d={`M53,${41 - brow * 4} L65,${39 - brow * 6}`} stroke={tk.text} strokeWidth={sw} strokeLinecap="round" />
			<path d={speak ? 'M44,60 Q50,66 56,60' : 'M45,61 L55,61'} stroke={tk.text} strokeWidth={sw * 0.8} strokeLinecap="round" fill="none" />
		</svg>
	);
};

export const HeadStack: React.FC<HeadStackProps> = ({tk, frame: f, box, label, heads, speaker = 0, quote, tally, speakAt}) => {
	const {width: W, height: H} = boxPx(box);
	const inn = enterP(tk, f, 0, 12);
	const {pad, head} = frameOf(tk);
	const n = Math.max(2, Math.min(5, heads.length));
	const list = heads.slice(0, n);
	const vw = W - pad * 2;
	const slot = vw / n;
	const D = Math.min(190, slot * 0.92);
	const sAt = speakAt ?? n * 4 + 14;
	const speaking = f >= sAt;
	const tilt = enterP(tk, f, sAt, 8);
	const words = quote.split(/\s+/).filter(Boolean);
	const qSize = fitSize(tk, 'display', tk.h1, words, vw, 4, 48);
	const lines = breakLines(tk, 'display', qSize, words, vw);
	const tallyH = tally ? tk.size.body * 2.6 : 0;
	const nameSize = lab(tk, 0.62);
	const rowTop = head + 30;
	const qBlock = lines.length * qSize * 1.12;
	const rowBot = rowTop + D + nameSize * 1.6;
	const qTop = rowBot + Math.max(40, (H - pad - tallyH - rowBot - qBlock) / 2);
	let k = 0;
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between'}}>
					<Label tk={tk}>{label}</Label>
					<Label tk={tk} color={speaking ? tk.accent : tk.label}>{speaking ? `${list[speaker] ?? ''} SPEAKS` : `${n} VOICES`}</Label>
				</div>
				{list.map((name, i) => {
					const p = popP(tk, f, 2 + i * 4);
					const me = speaking && i === speaker;
					return (
						<div key={i} style={{position: 'absolute', left: pad + slot * i + (slot - D) / 2, top: rowTop, width: D, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
							<div style={{transform: `translateY(${(me ? -12 * tilt : 0).toFixed(1)}px) scale(${(p * (me ? 1 + 0.08 * tilt : 1)).toFixed(4)}) rotate(${(me ? -7 * tilt : 0).toFixed(2)}deg)`, transformOrigin: '50% 90%'}}>
								<Head tk={tk} size={D} hair={i} speak={me} look={me ? tilt : 0} brow={me ? tilt : 0} />
							</div>
							<span style={{...txt(tk, 'mono', nameSize, me ? tk.accent : tk.label), opacity: p > 0.5 ? 1 : 0, letterSpacing: '0.08em', textTransform: 'uppercase', maxWidth: slot}}>{name}</span>
						</div>
					);
				})}
				<div style={{position: 'absolute', left: pad, right: pad, top: qTop, display: 'flex', flexDirection: 'column', gap: qSize * 0.12}}>
					{lines.map((ln, li) => (
						<div key={li} style={{display: 'flex', gap: qSize * 0.26, whiteSpace: 'nowrap'}}>
							{ln.map((w) => {
								const at = sAt + 4 + k++ * 3;
								const p = enterP(tk, f, at, 8);
								return (
									<span key={k} style={{...txt(tk, 'display', qSize, tk.text), overflow: 'visible', opacity: p, transform: `translateY(${((1 - p) * 20).toFixed(1)}px)`, display: 'inline-block'}}>{w}</span>
								);
							})}
						</div>
					))}
				</div>
				{tally && (
					<div style={{position: 'absolute', left: pad, right: pad, bottom: pad, display: 'flex', alignItems: 'center', gap: 18, opacity: enterP(tk, f, sAt + 8 + words.length * 3, 10)}}>
						<div style={{width: 40, height: tk.stroke.line, background: tk.series[0]}} />
						<span style={{...txt(tk, 'body', tk.size.body, tk.text), minWidth: 0, whiteSpace: 'normal'}}>{tally}</span>
					</div>
				)}
			</Card>
		</div>
	);
};
