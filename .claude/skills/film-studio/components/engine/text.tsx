import React from 'react';
import {measureText} from '@remotion/layout-utils';
import type {FontRole, Role, Zone} from './types';
import {cssFamily, fontCss, useColor, useD} from './tokens';

export type Fit = {size: number; lines: string[]; lineH: number; width: number};
const cache = new Map<string, Fit>();
const cased = (t: string, f: FontRole) => (f.case === 'upper' ? t.toUpperCase() : f.case === 'lower' ? t.toLowerCase() : t);

/** Largest size (px) at which `text` wraps inside the zone. Measured with the real, loaded font. */
export const fitLines = (text: string, f: FontRole, zone: Zone, maxPx: number, minPx = 10, maxLines = 6): Fit => {
	const key = [text, f.family, f.weight, f.tracking, f.case, Math.round(zone.w), Math.round(zone.h), Math.round(maxPx), maxLines].join('|');
	const hit = cache.get(key);
	if (hit) return hit;
	const words = cased(text, f).split(/\s+/).filter(Boolean);
	let out: Fit = {size: minPx, lines: [words.join(' ')], lineH: minPx * f.lineHeight, width: zone.w};
	for (let size = maxPx; size >= minPx; size *= 0.94) {
		const m = (t: string) => measureText({text: t, fontFamily: cssFamily(f.family), fontSize: size, fontWeight: String(f.weight), letterSpacing: `${f.tracking}em`, validateFontIsLoaded: false}).width;
		const lines: string[] = [];
		let cur = '', ok = true, widest = 0;
		for (const w of words) {
			if (m(w) > zone.w) { ok = false; break; }
			const next = cur ? cur + ' ' + w : w;
			if (m(next) <= zone.w) cur = next;
			else { lines.push(cur); cur = w; }
		}
		if (!ok) continue;
		if (cur) lines.push(cur);
		for (const l of lines) widest = Math.max(widest, m(l));
		if (lines.length <= maxLines && lines.length * size * f.lineHeight <= zone.h) { out = {size, lines, lineH: size * f.lineHeight, width: widest}; break; }
	}
	cache.set(key, out);
	return out;
};

export const useFit = (text: string, role: 'display' | 'body' | 'accent' | 'mono', zone: Zone, level: 'hero' | 'h1' | 'h2' | 'body' | 'label' | 'numeral', maxLines?: number) => {
	const {design, u} = useD();
	const f = design.fonts[role];
	const max = design.system.type_scale[level] * u * (design.fonts.scale ?? 1) * (zone.k ?? 1);
	return {fit: fitLines(text, f, zone, max, u * 1.6, maxLines), f};
};

/** Which font role and type level each text kind is measured with by the layout engine. */
export const KIND = {hero: ['display', 'hero', 4], h1: ['display', 'h1', 4], h2: ['display', 'h2', 3], kicker: ['accent', 'label', 1], sub: ['body', 'body', 4], label: ['body', 'label', 3], body: ['body', 'body', 4], attrib: ['accent', 'label', 2], numeral: ['display', 'numeral', 1]} as const;
export const measureKind = (design: {fonts: any; system: {type_scale: Record<string, number>}}, u: number, text: string, kind: keyof typeof KIND, w: number, k = 1): number => {
	const [role, level, ml] = KIND[kind];
	const fit = fitLines(text, design.fonts[role], {x: 0, y: 0, w, h: 1e6}, design.system.type_scale[level] * u * (design.fonts.scale ?? 1) * k, u * 1.6, ml);
	return fit.lines.length * fit.lineH;
};

/** Plain line renderer. Kits wrap it or replace it; `word` lets a kit restyle single words. */
export const TextLines: React.FC<{
	fit: Fit; f: FontRole; zone: Zone; color: Role; align?: 'left' | 'center' | 'right'; valign?: 'top' | 'middle' | 'bottom';
	emphasis?: string; word?: (w: string, em: boolean, li: number, wi: number) => React.ReactNode; lineStyle?: (li: number) => React.CSSProperties; style?: React.CSSProperties;
}> = ({fit, f, zone, color, align = 'left', valign = 'top', emphasis, word, lineStyle, style}) => {
	const c = useColor();
	const em = new Set((emphasis ?? '').toLowerCase().split(/\s+/).filter(Boolean));
	const isEm = (w: string) => em.has(w.toLowerCase().replace(/[^\p{L}\p{N}%$']/gu, ''));
	const totalH = fit.lines.length * fit.lineH;
	const top = valign === 'top' ? 0 : valign === 'middle' ? (zone.h - totalH) / 2 : zone.h - totalH;
	return (
		<div style={{position: 'absolute', left: zone.x, top: zone.y + top, width: zone.w, textAlign: align, color: c(color), ...fontCss({...f, case: 'none'}, fit.size), ...style}}>
			{fit.lines.map((l, li) => (
				<div key={li} style={{whiteSpace: 'nowrap', height: fit.lineH, ...(lineStyle?.(li) ?? {})}}>
					{word ? l.split(' ').map((w, wi) => <React.Fragment key={wi}>{wi ? ' ' : ''}{word(w, isEm(w), li, wi)}</React.Fragment>) : l}
				</div>
			))}
		</div>
	);
};
