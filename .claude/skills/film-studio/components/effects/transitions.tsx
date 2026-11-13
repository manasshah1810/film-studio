import React from 'react';
import {fill, lerp, reg} from './core';

// Transitions. "in" effects start at 0 s of a panel; "out" effects end at the panel's last frame.
reg('fade-in', (a) => ({style: {opacity: a.e}}));
reg('fade-out', (a) => ({style: {opacity: 1 - a.e}}));
const dip = (id: string, col: (a: Parameters<Parameters<typeof reg>[1]>[0]) => string) =>
	reg(id, (a) => ({over: a.on ? <div style={{...fill, background: col(a), opacity: a.bell}} /> : null}));
dip('dip-to-black', () => '#000');
dip('dip-to-white', () => '#fff');
dip('dip-to-color', (a) => a.c(a.s('role', 'primary'), 'primary'));

const inset = (t: number, r: number, b: number, l: number) => `inset(${t}% ${r}% ${b}% ${l}%)`;
reg('wipe-left', (a) => ({style: {clipPath: inset(0, 0, 0, 100 * (1 - a.e))}}));
reg('wipe-right', (a) => ({style: {clipPath: inset(0, 100 * (1 - a.e), 0, 0)}}));
reg('wipe-up', (a) => ({style: {clipPath: inset(100 * (1 - a.e), 0, 0, 0)}}));
reg('wipe-down', (a) => ({style: {clipPath: inset(0, 0, 100 * (1 - a.e), 0)}}));
reg('split-reveal', (a) => ({style: {clipPath: inset(50 * (1 - a.e), 0, 50 * (1 - a.e), 0)}}));
reg('diagonal-wipe', (a) => {
	const p = a.e * 200;
	return {style: {clipPath: `polygon(0 0, ${p}% 0, ${p - 100}% 100%, 0 100%)`}};
});
reg('iris-in', (a) => ({style: {clipPath: `circle(${a.e * 75}% at ${a.n('x', 50)}% ${a.n('y', 50)}%)`}}));
reg('iris-out', (a) => ({style: {clipPath: `circle(${(1 - a.e) * 75}% at ${a.n('x', 50)}% ${a.n('y', 50)}%)`}}));
reg('clock-wipe', (a) => {
	const m = `conic-gradient(#000 ${a.k * 360}deg, transparent ${a.k * 360}deg)`;
	return {style: a.k < 1 ? {WebkitMaskImage: m, maskImage: m} : undefined};
});
reg('blinds-in', (a) => {
	const g = a.u * a.n('gap', 6);
	const m = `repeating-linear-gradient(0deg, #000 0, #000 ${g * a.e}px, transparent ${g * a.e}px, transparent ${g}px)`;
	return {style: a.k < 1 ? {WebkitMaskImage: m, maskImage: m} : undefined};
});
reg('slide-in-left', (a) => ({style: {transform: `translateX(${-100 * (1 - a.o)}%)`}}));
reg('slide-in-right', (a) => ({style: {transform: `translateX(${100 * (1 - a.o)}%)`}}));
reg('slide-in-up', (a) => ({style: {transform: `translateY(${100 * (1 - a.o)}%)`}}));
reg('slide-out-left', (a) => ({style: {transform: `translateX(${-100 * a.e * a.e}%)`}}));
reg('drop-in', (a) => {
	const b = a.k < 1 ? Math.sin(a.k * Math.PI * 2.5) * (1 - a.k) * 4 : 0;
	return {style: {transform: `translateY(${-100 * (1 - a.o) + b}%)`}};
});
reg('spin-in', (a) => ({style: {transform: `rotate(${-a.n('deg', 8) * (1 - a.o)}deg) scale(${lerp(0.9, 1, a.o)})`, opacity: Math.min(1, a.k * 3)}}));
reg('zoom-through-in', (a) => ({style: {transform: `scale(${lerp(1.6, 1, a.o)})`, opacity: Math.min(1, a.k * 2.5), filter: a.k < 1 ? `blur(${(1 - a.o) * a.u}px)` : undefined}}));
reg('zoom-through-out', (a) => ({style: {transform: `scale(${lerp(1, 1.6, a.k * a.k)})`, opacity: 1 - a.k * a.k, filter: a.k > 0 ? `blur(${a.k * a.u}px)` : undefined}}));
reg('whip-pan-in', (a) => ({style: {transform: `translateX(${(a.s('from', 'right') === 'left' ? -1 : 1) * 60 * (1 - a.o)}%)`, filter: a.k < 1 ? `blur(${(1 - a.o) * a.u * 2.4}px)` : undefined}}));
reg('whip-pan-out', (a) => ({style: {transform: `translateX(${(a.s('to', 'left') === 'left' ? -1 : 1) * 60 * a.k * a.k}%)`, filter: a.k > 0 ? `blur(${a.k * a.u * 2.4}px)` : undefined}}));
reg('glitch-cut', (a) => {
	if (!a.on) return {};
	const j = (a.r('g' + a.lt) - 0.5) * a.u * a.n('amount', 4) * (1 - a.k);
	return {style: {transform: `translateX(${j}px) skewX(${j * 0.2}deg)`, filter: `hue-rotate(${(a.r('h' + a.lt) - 0.5) * 90 * (1 - a.k)}deg) contrast(${1 + 0.4 * (1 - a.k)})`}};
});
reg('flash-cut', (a) => ({over: a.on ? <div style={{...fill, background: '#fff', opacity: 1 - a.o}} /> : null}));
reg('color-plate-wipe', (a) => ({over: a.on ? <div style={{...fill, background: a.c(a.s('role', 'primary'), 'primary'), transform: `translateX(${lerp(-100, 100, a.e)}%)`}} /> : null}));
reg('curtain-close', (a) => {
	if (a.k <= 0) return {};
	const col = a.c(a.s('role', 'ink'), 'ink');
	return {over: (<><div style={{...fill, right: 'auto', width: `${50 * a.e}%`, background: col}} /><div style={{...fill, left: 'auto', width: `${50 * a.e}%`, background: col}} /></>)};
});
