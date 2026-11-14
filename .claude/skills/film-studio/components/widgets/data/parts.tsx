import React from 'react';
import {fontCss} from '../../engine/tokens';
import {card, txt} from '../social/tokens';
import {TAB, type DataTokens, lab} from './tokens';

/** A number in the style's numeral font, tabular. */
export const numCss = (tk: DataTokens, size: number, color: string): React.CSSProperties => ({...txt(tk, tk.num, size, color), ...TAB, textTransform: 'none'});

/** The widget card: the style's card fill, radius and border, sized to the box. */
export const Card: React.FC<{tk: DataTokens; w: number; h: number; style?: React.CSSProperties; children?: React.ReactNode}> = ({tk, w, h, style, children}) => (
	<div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, ...card(tk, 'surface'), overflow: 'hidden', ...style}}>{children}</div>
);

/** Small upper label row: mono, label colour, tracked. */
export const Label: React.FC<{tk: DataTokens; children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties}> = ({tk, children, color, size, style}) => (
	<span style={{...txt(tk, 'mono', size ?? lab(tk, 0.82), color ?? tk.label), ...TAB, letterSpacing: '0.12em', textTransform: 'uppercase', ...style}}>{children}</span>
);

/**
 * Odometer: each digit is a fixed-width column of 0-9 that rolls; higher columns carry as the lower one passes 9.
 * The column count is fixed by the larger of `from` and `to`. Every digit column is 1ch wide; a leading column that is not
 * needed fades and closes its width as the value falls past its power of ten (1.33x band), so the number sits flush.
 * `p` is the 0..1 progress (pass a rollP value). At p = 1 every column sits exactly on the final digit.
 */
export const Odometer: React.FC<{
	tk: DataTokens; from: number; to: number; p: number; size: number; color: string; dec?: number; prefix?: string; suffix?: string; group?: boolean;
}> = ({tk, from, to, p, size, color, dec = 0, prefix = '', suffix = '', group = true}) => {
	const scale = 10 ** dec;
	const v = Math.round((from + (to - from) * p) * scale * 1e4) / 1e4;
	const n = Math.max(String(Math.round(Math.abs(from) * scale)).length, String(Math.round(Math.abs(to) * scale)).length, dec + 1);
	const pos: number[] = [];
	for (let i = 0; i < n; i++) {
		const x = Math.abs(v) / 10 ** i;
		pos.push(i === 0 ? x % 10 : (Math.floor(x) % 10) + Math.max(0, pos[i - 1] - 9));
	}
	const lg = Math.log10(Math.max(Math.abs(v) * scale, 1));
	const show = (i: number) => (i <= dec ? 1 : Math.max(0, Math.min(1, (lg - i) * 8 + 1)));
	const lh = 1.12;
	const f = fontCss(tk.font[tk.num], size);
	const cells: React.ReactNode[] = [];
	for (let i = n - 1; i >= 0; i--) {
		const fade = show(i);
		cells.push(
			<span key={`d${i}`} style={{display: 'inline-block', width: `${fade}ch`, height: `${lh}em`, overflow: 'hidden', verticalAlign: 'top', opacity: fade}}>
				<span style={{display: 'flex', flexDirection: 'column', transform: `translateY(${(-pos[i] * 100) / 11}%)`}}>
					{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d, k) => (
						<span key={k} style={{height: `${lh}em`, lineHeight: `${lh}em`, textAlign: 'center'}}>{d}</span>
					))}
				</span>
			</span>,
		);
		if (i === dec && dec > 0) cells.push(<span key="pt">.</span>);
		else if (group && i > dec && (i - dec) % 3 === 0) cells.push(<span key={`g${i}`} style={{opacity: show(i), display: 'inline-block', width: `${show(i) * 0.3}em`, overflow: 'hidden'}}>,</span>);
	}
	return (
		<span style={{...f, ...TAB, color, lineHeight: lh, letterSpacing: 0, textTransform: 'none', display: 'inline-flex', alignItems: 'flex-start', whiteSpace: 'nowrap'}}>
			{prefix ? <span>{prefix}</span> : null}
			{cells}
			{suffix ? <span>{suffix}</span> : null}
		</span>
	);
};

/** Arc path on a circle (angles in degrees, 0 = 12 o'clock, clockwise). */
export const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
	const pt = (a: number) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)];
	const [x0, y0] = pt(a0);
	const [x1, y1] = pt(a1);
	const large = Math.abs(a1 - a0) % 360 > 180 ? 1 : 0;
	if (Math.abs(a1 - a0) >= 359.99) return `M${cx} ${cy - r} A${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`;
	return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${large} ${a1 > a0 ? 1 : 0} ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};
export const polar = (cx: number, cy: number, r: number, a: number): [number, number] => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)];
