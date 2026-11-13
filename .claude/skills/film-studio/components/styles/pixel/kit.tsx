import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {Kit, Role} from '../../engine/types';
import {clamp01, rnd, rr, useColor, useD} from '../../engine/tokens';
import {makeBubble, makeChart, makeHeadline, makeLabel, makeNumeral} from '../../engine/base';
import {Scanlines, Vignette} from '../../engine/fx';
import {fitBox} from '../../engine/layout';
import {rasterize} from '../../engine/shapes';

const useTx = () => useD().design.system.textures as Record<string, number>;
/** One screen pixel of the fake console, in real pixels. Everything snaps to it. */
const usePx = () => { const {u} = useD(); return Math.max(2, Math.round(u * useTx().px)); };

/** Dithered sky bands, a tiled floor, a few blinking stars: an 8-bit stage. */
const Backdrop: Kit['Backdrop'] = ({panel, t}) => {
	const {design, W, H, safe} = useD();
	const c = useColor(), tx = useTx(), px = usePx();
	const sd = `${design.seed}-${panel.id}`;
	const fy = Math.round(Math.max(safe.y + safe.h, H * 0.84) / px) * px;
	const check = `conic-gradient(${c('shadow')} 25%, transparent 0 50%, ${c('shadow')} 0 75%, transparent 0)`;
	return (
		<AbsoluteFill style={{background: c('bg'), imageRendering: 'pixelated'}}>
			{[0, 1, 2].map((i) => <div key={i} style={{position: 'absolute', left: 0, right: 0, top: fy - px * (10 + i * 14), height: px * (i === 0 ? 10 : 6), backgroundImage: check, backgroundSize: `${px * 2 * (i + 1)}px ${px * 2}px`, opacity: tx.dither_opacity / (i + 1)}} />)}
			{Array.from({length: tx.stars}, (_, i) => rnd(sd + 'b' + i + Math.floor(t / 12)) > 0.25 ? <div key={i} style={{position: 'absolute', left: Math.round((rr(sd + 'x' + i, 0.04, 0.96) * W) / px) * px, top: Math.round((rr(sd + 'y' + i, 0.03, 0.7) * H) / px) * px, width: px, height: px, background: c('highlight'), opacity: 0.8}} /> : null)}
			<div style={{position: 'absolute', left: 0, right: 0, top: fy, bottom: 0, background: c('shadow')}} />
			<div style={{position: 'absolute', left: 0, right: 0, top: fy, height: px, background: c('ink')}} />
			<div style={{position: 'absolute', left: 0, right: 0, top: fy + px * 3, bottom: 0, backgroundImage: `linear-gradient(90deg, ${c('ink')} ${px}px, transparent ${px}px), linear-gradient(0deg, ${c('ink')} ${px}px, transparent ${px}px)`, backgroundSize: `${px * 16}px ${px * 8}px`, opacity: tx.tile_opacity}} />
		</AbsoluteFill>
	);
};
const Finish: Kit['Finish'] = () => {
	const c = useColor(), tx = useTx(), px = usePx();
	return <><Scanlines color={c('ink')} gap={px * 2} opacity={tx.scanline_opacity} /><Vignette color={c('ink')} inner={62} strength={tx.vignette} /></>;
};

const shadow = (c: (r: Role) => string, k: number) => ({textShadow: `${k}em ${k}em 0 ${c('shadow')}`});
const Headline = makeHeadline({enter: 'type', em: 'color', css: ({c}) => shadow(c, 0.09)});
const Label = makeLabel({kicker: 'pill', pillR: 0, enter: 'type'});
const Numeral = makeNumeral({
	enter: 'count', css: ({c}) => ({textShadow: `0.07em 0.07em 0 ${c('ink')}`}),
	deco: ({w, h, u, c, big, p}) => big ? <div style={{position: 'absolute', left: -u * 3, top: -u * 0.5, width: w + u * 6, height: h + u, background: c('bg'), boxShadow: `0 0 0 ${u * 0.6}px ${c('ink')}, ${u * 1.2}px ${u * 1.2}px 0 ${u * 0.6}px ${c('ink')}`, opacity: clamp01(p * 6)}} /> : null,
});
const Chart = makeChart({step: true, cap: 'square', sw: 0.9, lead: 1.3, axisSw: 0.6, annot: 'flag', labelFont: 'mono', nameFont: 'mono', labelSize: 2.6});
const Bubble = makeBubble({r: 0, sw: 0.7, shadow: 'ink', font: 'accent'});

/** Sprites: shapes are rasterised to a coarse grid, given a 1-cell ink outline, and built row by row. */
const Marks: Kit['Marks'] = ({zone, p, shapes, vb, flip, kind, state}) => {
	const c = useColor(), tx = useTx();
	const cols = Math.round(kind === 'figure' ? tx.sprite_cols : tx.sprite_cols * 1.1), rows = Math.round((cols * vb[1]) / vb[0]);
	const box = fitBox(zone, vb, 0.5, kind === 'figure' ? 1 : 0.5);
	const cell = Math.max(1, Math.floor(box.w / cols));
	const grid = React.useMemo(() => rasterize(shapes, vb, cols, rows, 1.6), [shapes, cols, rows, vb]);
	const at = (x: number, y: number) => (x < 0 || y < 0 || x >= cols || y >= rows ? -1 : grid[y * cols + (flip ? cols - 1 - x : x)]);
	const colour = (si: number) => { const s = shapes[si]; const r = (s.t === 'line' || !s.fill || s.fill === 'none' ? s.stroke ?? 'ink' : s.fill) as Role; return c(r === 'none' as string ? 'ink' : r); };
	const shown = Math.ceil(clamp01(p) * rows);
	const rects: React.ReactNode[] = [];
	for (let y = rows - shown; y < rows; y++) {
		for (let x = 0; x < cols; ) {
			const si = at(x, y);
			const edge = si < 0 && (at(x - 1, y) >= 0 || at(x + 1, y) >= 0 || at(x, y - 1) >= 0 || at(x, y + 1) >= 0);
			if (si < 0 && !edge) { x++; continue; }
			const fill = si < 0 ? c('ink') : colour(si);
			let n = 1;
			while (x + n < cols && at(x + n, y) === si && si >= 0) n++;
			rects.push(<rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={n * cell} height={cell} fill={fill} />);
			x += n;
		}
	}
	return <svg width={cols * cell} height={rows * cell} shapeRendering="crispEdges" style={{position: 'absolute', left: Math.round(box.x + (box.w - cols * cell) / 2), top: Math.round(box.y + box.h - rows * cell), opacity: state === 'dim' ? 0.55 : 1}}>{rects}</svg>;
};

export const kit: Kit = {Backdrop, Headline, Label, Numeral, Marks, Chart, Finish, Bubble};
