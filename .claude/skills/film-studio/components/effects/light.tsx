import React from 'react';
import {rgba} from '../engine/tokens';
import {Vignette} from '../engine/fx';
import {fill, reg} from './core';

// Colour and light. Colours always come from the film's palette roles (param `role`), never a hex.
reg('flash', (a) => ({over: a.on ? <div style={{...fill, background: a.c(a.s('role', 'highlight')), opacity: a.bell * a.n('amount', 0.7), mixBlendMode: 'screen'}} /> : null}));
reg('strobe', (a) => ({over: a.on && Math.floor(a.lt / Math.max(1, a.n('every', 3))) % 2 === 0 ? <div style={{...fill, background: a.c(a.s('role', 'highlight')), opacity: a.n('amount', 0.35)}} /> : null}));
reg('spotlight', (a) => {
	const x = a.n('x', 50), y = a.n('y', 45), r = a.n('radius', 34);
	return {over: <div style={{...fill, background: `radial-gradient(circle at ${x}% ${y}%, transparent ${r}%, ${rgba(a.c('ink', 'ink') === a.c('bg', 'bg') ? '#000000' : '#000000', a.n('amount', 0.55))} ${r + 26}%)`, opacity: a.e}} />};
});
reg('vignette-pulse', (a) => ({over: a.on ? <div style={{...fill, opacity: a.bell}}><Vignette color="#000000" inner={40} strength={a.n('amount', 0.7)} /></div> : null}));
reg('light-sweep', (a) => {
	if (!a.on) return {};
	const p = -40 + a.e * 180;
	return {over: <div style={{...fill, background: `linear-gradient(${a.n('deg', 110)}deg, transparent ${p - 14}%, ${rgba(a.c(a.s('role', 'highlight')), a.n('amount', 0.45))} ${p}%, transparent ${p + 14}%)`, mixBlendMode: 'screen'}} />};
});
reg('light-leak', (a) => {
	const d = Math.sin(a.t / 40) * 6;
	return {over: <div style={{...fill, background: `radial-gradient(circle at ${88 + d}% ${10 - d}%, ${rgba(a.c(a.s('role', 'highlight')), a.n('amount', 0.5))}, transparent 46%), radial-gradient(circle at ${4 - d}% ${92 + d}%, ${rgba(a.c('primary', 'primary'), a.n('amount', 0.5) * 0.6)}, transparent 40%)`, mixBlendMode: 'screen', opacity: a.e}} />};
});
reg('color-pop', (a) => ({style: {filter: `saturate(${1 + a.n('amount', 0.5) * a.e})`}}));
reg('desaturate', (a) => ({style: {filter: `grayscale(${a.n('amount', 0.9) * a.e})`}}));
reg('duotone-wash', (a) => ({over: <div style={{...fill, background: a.c(a.s('role', 'primary'), 'primary'), mixBlendMode: 'color', opacity: a.n('amount', 0.6) * a.e}} />}));
reg('invert-hit', (a) => ({style: a.on && a.lt < Math.max(2, a.n('frames', 3)) ? {filter: 'invert(1)'} : undefined}));
reg('bloom', (a) => ({style: a.on ? {filter: `brightness(${1 + a.n('amount', 0.25) * a.bell}) contrast(${1 + 0.1 * a.bell})`} : undefined}));
reg('night-fall', (a) => ({style: {filter: `brightness(${1 - a.n('amount', 0.35) * a.e}) saturate(${1 - 0.3 * a.e})`}, over: <div style={{...fill, background: a.c('shadow', 'shadow'), mixBlendMode: 'multiply', opacity: 0.5 * a.e}} />}));
reg('warm-up', (a) => ({over: <div style={{...fill, background: a.c(a.s('role', 'highlight')), mixBlendMode: 'soft-light', opacity: a.n('amount', 0.5) * a.e}} />}));
reg('hue-drift', (a) => ({style: {filter: `hue-rotate(${Math.sin((a.t / Math.max(1, a.panelDur)) * Math.PI * 2) * a.n('deg', 12)}deg)`}}));
