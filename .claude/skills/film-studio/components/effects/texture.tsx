import React from 'react';
import {rgba} from '../engine/tokens';
import {Halftone, Scanlines, Vignette} from '../engine/fx';
import {Grain} from '../engine/marks';
import {fill, reg} from './core';

// Texture and frame overlays. They sit above the panel and normally run for its whole length.
reg('film-grain', (a) => ({over: <Grain id={`fx-fg-${a.seed}`} freq={a.n('freq', 0.85)} opacity={a.n('amount', 0.18) * a.e} blend="overlay" seed={2 + (Math.floor(a.t / 2) % 6)} />}));
reg('paper-grain', (a) => ({over: <Grain id={`fx-pg-${a.seed}`} freq={a.n('freq', 0.7)} opacity={a.n('amount', 0.16) * a.e} octaves={3} />}));
reg('scanlines', (a) => ({over: <div style={{...fill, opacity: a.e}}><Scanlines color="#000000" gap={a.u * a.n('gap', 0.6)} opacity={a.n('amount', 0.14)} /></div>}));
reg('halftone-overlay', (a) => ({over: <Halftone id={`fx-ht-${a.seed}`} color={a.c(a.s('role', 'shadow'), 'shadow')} cell={a.u * a.n('cell', 1.6)} r={0.34} angle={a.n('deg', 30)} opacity={a.n('amount', 0.3) * a.e} mask="linear-gradient(200deg, #000 0%, transparent 60%)" style={{mixBlendMode: 'multiply'}} />}));
reg('vignette', (a) => ({over: <div style={{...fill, opacity: a.e}}><Vignette color="#000000" inner={a.n('inner', 46)} strength={a.n('amount', 0.5)} /></div>}));
reg('letterbox', (a) => {
	const h = `${a.n('amount', 9) * a.e}%`;
	return {over: (<><div style={{...fill, bottom: 'auto', height: h, background: '#000'}} /><div style={{...fill, top: 'auto', height: h, background: '#000'}} /></>)};
});
reg('frame-border', (a) => ({over: <div style={{...fill, inset: a.u * a.n('inset', 2.4), border: `${Math.max(1, a.u * a.n('width', 0.3))}px solid ${a.c(a.s('role', 'ink'), 'ink')}`, opacity: a.e}} />}));
reg('corner-brackets', (a) => {
	const m = a.u * a.n('inset', 4), L = a.u * 5 * a.e, w = Math.max(1.5, a.u * 0.3), col = a.c(a.s('role', 'ink'), 'ink');
	const b = (h: 'left' | 'right', v: 'top' | 'bottom'): React.CSSProperties => ({position: 'absolute', [h]: m, [v]: m, width: L, height: L, [`border${h === 'left' ? 'Left' : 'Right'}`]: `${w}px solid ${col}`, [`border${v === 'top' ? 'Top' : 'Bottom'}`]: `${w}px solid ${col}`});
	return {over: (<><div style={b('left', 'top')} /><div style={b('right', 'top')} /><div style={b('left', 'bottom')} /><div style={b('right', 'bottom')} /></>)};
});
reg('grid-overlay', (a) => {
	const g = a.u * a.n('cell', 5), col = rgba(a.c(a.s('role', 'ink'), 'ink'), a.n('amount', 0.12));
	return {over: <div style={{...fill, opacity: a.e, background: `linear-gradient(90deg, ${col} 1px, transparent 1px) 0 0 / ${g}px ${g}px, linear-gradient(0deg, ${col} 1px, transparent 1px) 0 0 / ${g}px ${g}px`}} />};
});
reg('dust-specks', (a) => {
	const f = Math.floor(a.t / Math.max(1, a.n('every', 3)));
	const col = a.c(a.s('role', 'ink'), 'ink');
	return {over: (
		<div style={{...fill, opacity: a.n('amount', 0.5) * a.e}}>
			{Array.from({length: 7}, (_, i) => {
				const s = a.u * (0.15 + a.r(`s${f}-${i}`) * 0.5), line = a.r(`l${f}-${i}`) > 0.7;
				return <div key={i} style={{position: 'absolute', left: `${a.r(`x${f}-${i}`) * 100}%`, top: `${a.r(`y${f}-${i}`) * 100}%`, width: s, height: line ? s * 14 : s, borderRadius: line ? 0 : '50%', background: col, transform: `rotate(${a.r(`r${f}-${i}`) * 20 - 10}deg)`}} />;
			})}
		</div>
	)};
});
reg('vhs-tracking', (a) => {
	const y = ((a.t * a.n('speed', 1.2)) % 130) - 15;
	return {style: {filter: 'saturate(1.15) contrast(1.05)'}, over: <div style={{...fill, top: `${y}%`, bottom: 'auto', height: `${a.n('height', 7)}%`, background: `linear-gradient(180deg, transparent, ${rgba('#ffffff', a.n('amount', 0.22))} 40%, ${rgba('#000000', 0.25)} 60%, transparent)`, opacity: a.e}} />};
});
reg('noise-flicker', (a) => ({style: {filter: `brightness(${1 + (a.r('f' + a.t) - 0.5) * a.n('amount', 0.12) * a.e})`}}));
