import React, {useId} from 'react';
import {random} from 'remotion';
import {mix} from '../../engine/tokens';
import {boxPx, boxStyle, enterP, lin, moveP, txt} from '../social/tokens';
import {Card, Label, Odometer, numCss} from './parts';
import {rollP, type DataBase, lab} from './tokens';

/**
 * 25 Banknote. A made-up note (guilloche lines and a rosette, no portrait, no real currency design) slides in; then its
 * value rolls from `from` to `to` and the lost share of the note drains to a dashed outline. Purchasing power, a price shift.
 */
export type BanknoteProps = DataBase & {from: number; to: number; symbol: string; dec?: number; label: string; years: [string, string]; caption: string; shiftAt?: number; seed: string};
export const BANKNOTE = {frames: 100, hero: 94, sfx: [{at: 4, id: 'cash-rustle'}, {at: 'shiftAt', id: 'digital-tick'}, {at: 'shiftAt + 40', id: 'sub-bass-hit'}]};

/** Guilloche band: overlapping sine waves, seeded phase. */
const guilloche = (w: number, h: number, seed: string, n: number) =>
	Array.from({length: n}, (_, k) => {
		const ph = random(`${seed}-${k}`) * Math.PI * 2;
		const amp = h * (0.18 + 0.1 * Math.sin(k));
		const pts: string[] = [];
		for (let x = 0; x <= w; x += 8) pts.push(`${x.toFixed(0)} ${(h / 2 + amp * Math.sin((x / w) * Math.PI * 6 + ph) * Math.cos((x / w) * Math.PI * 1.5 + k)).toFixed(1)}`);
		return `M${pts.join(' L')}`;
	});

const rosette = (cx: number, cy: number, r: number, petals: number) => {
	const pts: string[] = [];
	for (let i = 0; i <= 720; i++) {
		const t = (i / 720) * Math.PI * 2;
		const rr = r * (0.62 + 0.38 * Math.cos(petals * t));
		pts.push(`${(cx + rr * Math.cos(t * 3)).toFixed(1)} ${(cy + rr * Math.sin(t * 3)).toFixed(1)}`);
	}
	return `M${pts.join(' L')}`;
};

export const Banknote: React.FC<BanknoteProps> = ({tk, frame: f, box, from, to, symbol, dec = 0, label, years, caption, shiftAt = 36, seed}) => {
	const {width: W, height: H} = boxPx(box);
	const id = `bn${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
	const inn = enterP(tk, f, 0, 12);
	const pad = 56;
	const nw = W - pad * 2, nh = Math.min(nw / 2.15, H * 0.36);
	const slide = moveP(tk, f, 4, 22);
	const roll = rollP(tk, f, shiftAt, 40);
	const keep = to / from;
	const cut = nw * (1 - (1 - keep) * roll);
	const paper = mix(tk.c.surface, tk.series[0], 0.1);
	const ink = tk.series[0];
	const lost = Math.round((1 - keep) * 100 * roll);
	const SPEC = 'SPECIMEN · NOT LEGAL TENDER';
	const sfs = lab(tk, 0.7);
	// Mono advance is about 0.6em; tracking drops from 0.2em to 0.04em when the style's label floor makes the line too wide for the note.
	const ls = SPEC.length * sfs * 0.8 <= nw - 80 ? 0.2 : 0.04;
	return (
		<div style={{...boxStyle(box), opacity: Math.min(1, inn * 1.5), transform: `translateY(${(1 - inn) * 40}px)`}}>
			<Card tk={tk} w={W} h={H}>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between'}}>
					<Label tk={tk}>{label}</Label>
					<Label tk={tk} color={tk.text}>{`${years[0]} → ${years[1]}`}</Label>
				</div>
				<div style={{position: 'absolute', left: pad, top: pad + 80, width: nw, height: nh, transform: `translateX(${(1 - slide) * -nw * 1.2}px) rotate(${(1 - slide) * -6}deg)`}}>
					<svg width={nw} height={nh} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
						<defs>
							<clipPath id={id}>
								<rect x={0} y={0} width={cut} height={nh} rx={tk.plateR} />
							</clipPath>
						</defs>
						<rect x={1} y={1} width={nw - 2} height={nh - 2} rx={tk.plateR} fill="none" stroke={tk.grid} strokeWidth={tk.stroke.hair} strokeDasharray="10 10" />
						<g clipPath={`url(#${id})`}>
							<rect x={0} y={0} width={nw} height={nh} rx={tk.plateR} fill={paper} stroke={ink} strokeWidth={tk.stroke.hair * 1.5} />
							<rect x={18} y={18} width={nw - 36} height={nh - 36} rx={Math.max(0, tk.plateR - 8)} fill="none" stroke={ink} strokeWidth={tk.stroke.hair} opacity={0.6} />
							<g fill="none" stroke={ink} strokeWidth={1.4} opacity={0.32}>
								{guilloche(nw - 36, nh * 0.42, seed, 7).map((d, k) => (
									<path key={k} d={d} transform={`translate(18 ${nh * 0.29})`} />
								))}
							</g>
							<path d={rosette(nw * 0.68, nh / 2, nh * 0.3, 7)} fill="none" stroke={ink} strokeWidth={1.2} opacity={0.5} />
							<circle cx={nw * 0.68} cy={nh / 2} r={nh * 0.1} fill={paper} stroke={ink} strokeWidth={tk.stroke.hair} />
						</g>
						{roll > 0 && roll < 1 && <line x1={cut} y1={-10} x2={cut} y2={nh + 10} stroke={tk.series[1]} strokeWidth={tk.stroke.line} style={{filter: tk.glow(tk.series[1])}} />}
					</svg>
					<div style={{position: 'absolute', left: 40, top: 32, width: Math.max(0, cut - 40), overflow: 'hidden', whiteSpace: 'nowrap'}}>
						<span style={{...numCss(tk, nh * 0.26, tk.text)}}>{`${symbol}${from}`}</span>
					</div>
					<div style={{position: 'absolute', left: 40, bottom: 30, width: Math.max(0, cut - 40), overflow: 'hidden', whiteSpace: 'nowrap'}}>
						<span style={{...txt(tk, 'mono', sfs, tk.text), letterSpacing: `${ls}em`}}>{SPEC}</span>
					</div>
				</div>
				<div style={{position: 'absolute', left: pad, right: pad, top: pad + 80 + nh + 46, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 20}}>
					<Odometer tk={tk} from={from} to={to} p={roll} dec={dec} size={tk.numeral * 0.92} color={tk.accent} prefix={symbol} />
					<span style={{...numCss(tk, tk.size.h2 * 0.9, tk.text), opacity: lin(f, shiftAt, shiftAt + 6)}}>{`−${lost}%`}</span>
				</div>
				<div style={{position: 'absolute', left: pad, right: pad, bottom: pad}}>
					<span style={{...txt(tk, 'body', tk.size.body * 0.86, tk.text), whiteSpace: 'normal', opacity: enterP(tk, f, shiftAt + 36, 12)}}>{caption}</span>
				</div>
			</Card>
		</div>
	);
};
