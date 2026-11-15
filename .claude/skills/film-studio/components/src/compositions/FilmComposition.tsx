import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {BoxDef, CastEntry, MotionDef, PanelDefM, Pct, RenderManifest, ShapeDef} from '../manifest';
import {captionAt, dbToGain, duckedMusicGain} from '../manifest';
import {DESIGN_SYSTEMS} from '../design-systems';
import {FontGate} from '../../engine/fonts';
import {DesignProvider, contrast, fontCss} from '../../engine/tokens';
import type {Design, FilmDef, Pairing} from '../../engine/types';
import {EFFECTS} from '../../effects';
import {WIDGETS, WIDGET_TOKENS, type WidgetFamily} from '../../widgets/registry';
import {BESPOKE} from '../../bespoke/registry';
import {makeKit} from '../../bespoke/kit';
import {elasticPullBackZoom, gravityDropBounce, springPopIn} from '../../motions/physics';
import {directionalWhipPan, simulatedDollyPush, zeroDeadVelocityDrift} from '../../motions/camera';
import {activeWordHighlight, hackerDecodeScramble, odometerNumberRoll, svgPathDrawOn} from '../../motions/text-data';
import {CHANNEL_MATRIX, axisFlip3D, filmGateFlicker, rgbChromaticGlitch, stopMotionSteppedJitter} from '../../motions/effects';

/**
 * FilmComposition: the one production composition. It renders ONLY from work/render-manifest.json
 * (schemas/render-manifest.schema.json, built by scripts/build-film.js). No topic string, colour or font lives
 * in this file: the style is chosen by `design.style`, its design-system.json is looked up in DESIGN_SYSTEMS,
 * and every colour is a palette role, every font a pairing role.
 *
 * Full-canvas mandate (personas/art-director.md section 0a), back to front:
 *   1. Atmosphere: style-matched gradient from the palette roles, an animated grid, film grain, drifting ambient
 *      light and a vignette, so no frame is ever an empty flat field.
 *   2. Hero: panels (transition, cards with gradient fill, crisp border and drop shadow, motion primitives, layered
 *      cast, bespoke topic scenes on their own card, micro-widgets, VFX wrappers) under a continuous camera push-in
 *      (scale 1.00 -> 1.08 per panel) inside the Zero Dead Velocity drift.
 *   3. Center-stage kinetic captions: 2 to 4 words, at least 64 px, centred above the bottom 20% dead zone, the
 *      active word pops.
 * Then the safe-zone overlay (Pass 1). Audio: audio.mix (scripts/sound-bed.js: narration + pulse bed + sub-bass
 * hits + transition SFX) when present; otherwise SFX on their frames, voiceover clips and the ducked music bed.
 */

type DS = (typeof DESIGN_SYSTEMS)[string];
type R = {ds: DS; roles: Record<string, string>; pairing: Pairing; role: (r: string) => string; k: number; W: number; H: number; seed: string; m: RenderManifest};

export const resolveDesign = (m: RenderManifest) => {
	const ds = DESIGN_SYSTEMS[m.design.style];
	if (!ds) throw new Error(`film-studio: style "${m.design.style}" has no design-system.json in DESIGN_SYSTEMS`);
	const pal = ds.palettes.find((p: {id: string}) => p.id === m.design.palette_id);
	if (!pal) throw new Error(`film-studio: palette "${m.design.palette_id}" is not in ${m.design.style}`);
	const pairing = ds.fonts.find((p: {id: string}) => p.id === m.design.pairing_id) as Pairing | undefined;
	if (!pairing) throw new Error(`film-studio: pairing "${m.design.pairing_id}" is not in ${m.design.style}`);
	const roles = pal.roles as Record<string, string>;
	const role = (r: string) => {
		const v = roles[r];
		if (!v) throw new Error(`film-studio: "${r}" is not a role of palette ${pal.id}`);
		return v;
	};
	return {ds, roles, pairing, role};
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** #rrggbb + alpha -> #rrggbbaa (palette roles stay the only colour source). */
const alpha = (hex: string, a: number) => (/^#[0-9a-f]{6}$/i.test(hex) ? hex + Math.round(clamp01(a) * 255).toString(16).padStart(2, '0') : hex);
const isDark = (hex: string) => { const n = parseInt(hex.slice(1, 7), 16); return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 128; };
/** A role, or the first fallback role the palette has (focused palettes lack some roles). */
const roleOr = (r: R, ...names: string[]) => { for (const n of names) if (r.roles[n]) return r.roles[n]; return r.roles.ink; };
const smooth = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t); };
const pctPx = (b: Pct, W: number, H: number) => ({left: (b.x / 100) * W, top: (b.y / 100) * H, width: (b.w / 100) * W, height: (b.h / 100) * H});
const bump = (f: number, at: number, frames: number) => (f < at || f > at + frames ? 0 : Math.sin(Math.PI * clamp01((f - at) / Math.max(1, frames))));
const SIZE: Record<string, string> = {display: 'display', body: 'body', label: 'label', caption: 'caption'};
const pxFor = (r: R, b: BoxDef) => (b.px ?? r.ds.type_scale?.[SIZE[b.role ?? 'body']] ?? r.ds.type_scale?.body ?? 44) * r.k;

// ------------------------------------------------------------------ text boxes and their motion primitives
const decodeLines = (lines: string[], f: number, m: MotionDef, seed: string) => lines.map((l, i) => hackerDecodeScramble(f, {text: l, start: m.frame + i * 4, frames: m.frames, seed: `${seed}-${i}`}).text);
const rollLines = (lines: string[], f: number, m: MotionDef) =>
	lines.map((l) => {
		const hit = l.match(/\d[\d,.]*/);
		if (!hit) return l;
		const to = typeof m.params?.to === 'number' ? (m.params.to as number) : Number(hit[0].replace(/,/g, ''));
		const from = typeof m.params?.from === 'number' ? (m.params.from as number) : 0;
		const decimals = (hit[0].split('.')[1] ?? '').length;
		const o = odometerNumberRoll(f, {from, to, start: m.frame, frames: m.frames, decimals, group: hit[0].includes(',')});
		return l.replace(hit[0], o.text);
	});

const TextBox: React.FC<{r: R; b: BoxDef; i: number; f: number; p: PanelDefM}> = ({r, b, i, f, p}) => {
	// frame 0 is the platform cover frame: text of the film's first panel is already landed there
	const enterAt = p.from === 0 && b.from === undefined ? -30 : (b.from ?? p.from) + i * (r.ds.motion?.stagger_frames ?? 4);
	if (f < (b.from ?? p.from) || (b.to !== undefined && f >= b.to)) return null;
	const pop = springPopIn(f, {start: enterAt, spring: 'snappy', from: 0.9, rise: 18 * r.k});
	let lines = b.lines ?? (b.text ? [b.text] : []);
	const tf: string[] = [`translateY(${pop.y.toFixed(2)}px)`, `scale(${pop.scale.toFixed(4)})`];
	const filters: string[] = [];
	let glitch: ReturnType<typeof rgbChromaticGlitch> | null = null;
	let draw: ReturnType<typeof svgPathDrawOn> | null = null;
	const box = pctPx(b, r.W, r.H);
	for (const m of p.motion.filter((x) => x.target === b.id && f >= x.frame)) {
		const seed = `${r.seed}-${p.id}-${b.id}-${m.frame}`;
		if (m.primitive === 'text-decode') lines = decodeLines(lines, f, m, seed);
		else if (m.primitive === 'odometer-roll') lines = rollLines(lines, f, m);
		else if (m.primitive === 'spring-overshoot') tf.push(`scale(${springPopIn(f, {start: m.frame, spring: 'bouncy', from: 0.7}).scale.toFixed(4)})`);
		else if (m.primitive === 'gravity-drop') tf.push(`translateY(${gravityDropBounce(f, {start: m.frame, height: 240 * r.k}).y.toFixed(2)}px)`);
		else if (m.primitive === 'axis-flip') {
			const fl = axisFlip3D(f, {start: m.frame, frames: m.frames ?? 18, mode: 'swap', axis: (m.params?.axis as 'x' | 'y') ?? 'y'});
			tf.push(`perspective(${fl.parentStyle.perspective}) ${fl.transform}`);
			filters.push(`brightness(${fl.brightness.toFixed(3)})`);
		} else if (m.primitive === 'stop-motion-jitter') {
			const j = stopMotionSteppedJitter(f, {start: m.frame, end: m.frame + (m.frames ?? 60), seed});
			if (j.active) tf.push(j.transform);
		} else if (m.primitive === 'rgb-split-glitch') {
			const g = rgbChromaticGlitch(f, {start: m.frame, frames: m.frames, seed});
			if (g.active) glitch = g;
		} else if (m.primitive === 'path-draw-on') draw = svgPathDrawOn(f, {path: box.width, start: m.frame, frames: m.frames ?? 20});
	}
	for (const bt of p.beats.filter((x) => x.target === b.id)) {
		const k = bump(f, bt.frame, bt.frames ?? 12);
		if (bt.kind === 'scale' || bt.kind === 'emphasis') tf.push(`scale(${(1 + 0.06 * k).toFixed(4)})`);
		else if (bt.kind === 'move') tf.push(`translateY(${(-14 * k * r.k).toFixed(2)}px)`);
		else if (bt.kind === 'swap') tf.push(`scaleY(${(1 - 0.35 * k).toFixed(4)})`);
	}
	const exit = p.beats.find((x) => x.target === b.id && x.kind === 'exit' && f >= x.frame);
	const opacity = pop.opacity * (exit ? 1 - clamp01((f - exit.frame) / Math.max(1, exit.frames ?? 8)) : 1);
	const font = fontCss(r.pairing[b.font ?? (b.role === 'display' ? 'display' : 'body')], pxFor(r, b));
	const plate = b.bg && b.bg !== 'bg';
	const radius = r.ds.tokens?.plate?.radius ?? r.ds.tokens?.card?.radius ?? 0;
	const body = (color: string, extra?: React.CSSProperties) => (
		<div style={{...font, color, whiteSpace: 'pre-line', ...extra}}>{lines.join('\n')}</div>
	);
	return (
		<div style={{position: 'absolute', ...box, opacity, transform: tf.join(' '), transformOrigin: '50% 50%', filter: filters.join(' ') || undefined}}>
			<div style={{position: 'relative', display: 'inline-block', maxWidth: box.width, padding: plate ? `${10 * r.k}px ${18 * r.k}px` : 0, background: plate ? r.role(b.bg as string) : undefined, borderRadius: plate ? radius * r.k : 0}}>
				{glitch ? body(r.role(b.color ?? 'ink'), {position: 'absolute', inset: plate ? `${10 * r.k}px ${18 * r.k}px` : 0, transform: glitch.redTransform, filter: 'url(#fs-ch-r)', mixBlendMode: 'screen'}) : null}
				{glitch ? body(r.role(b.color ?? 'ink'), {position: 'absolute', inset: plate ? `${10 * r.k}px ${18 * r.k}px` : 0, transform: glitch.blueTransform, filter: 'url(#fs-ch-b)', mixBlendMode: 'screen'}) : null}
				{body(r.role(b.color ?? 'ink'), {position: 'relative'})}
				{draw ? (
					<svg width={box.width} height={24 * r.k} style={{position: 'absolute', left: 0, bottom: -26 * r.k, overflow: 'visible'}}>
						<path d={`M 0 ${12 * r.k} L ${box.width} ${12 * r.k}`} stroke={r.role('primary')} strokeWidth={(r.ds.tokens?.line?.width ?? 8) * r.k} strokeLinecap="round" fill="none" strokeDasharray={draw.strokeDasharray} strokeDashoffset={draw.strokeDashoffset} />
					</svg>
				) : null}
			</div>
		</div>
	);
};

const CardBox: React.FC<{r: R; b: BoxDef; f: number; p: PanelDefM; i: number}> = ({r, b, f, p, i}) => {
	if (f < (b.from ?? p.from) || (b.to !== undefined && f >= b.to)) return null;
	const pop = springPopIn(f, {start: (b.from ?? p.from) + i * 2, spring: 'heavy', from: 0.94});
	const t = r.ds.tokens?.card ?? {};
	const fill = r.role(b.bg ?? 'surface');
	const border = t.border?.width ? `${t.border.width * r.k}px solid ${r.role(t.border.role ?? 'ink')}` : `${2 * r.k}px solid ${alpha(r.roles.ink, 0.16)}`;
	// hero card: gradient fill (lit from the top by the accent), crisp border, deep drop shadow
	const background = `linear-gradient(160deg, ${alpha(r.roles.primary, 0.14)} 0%, ${fill} 38%, ${fill} 100%)`;
	return <div style={{position: 'absolute', ...pctPx(b, r.W, r.H), background, borderRadius: (t.radius ?? 0) * r.k, border, boxShadow: `0 ${24 * r.k}px ${64 * r.k}px ${alpha(isDark(r.roles.bg) ? '#000000' : r.roles.ink, isDark(r.roles.bg) ? 0.55 : 0.22)}`, opacity: pop.opacity, transform: `scale(${pop.scale.toFixed(4)})`}} />;
};

// ------------------------------------------------------------------ layered characters (Narrator / Actor) and props
const Shape: React.FC<{s: ShapeDef; r: R}> = ({s, r}) => {
	const fill = s.fill && s.fill !== 'none' ? r.role(s.fill) : 'none';
	const stroke = s.stroke && s.stroke !== 'none' ? r.role(s.stroke) : undefined;
	const sw = typeof s.w === 'number' ? (s.w as number) : stroke ? 1.2 : 0;
	const pts = (s.pts as number[][] | undefined)?.map((p) => p.join(',')).join(' ');
	if (s.t === 'rect') return <rect x={s.x as number} y={s.y as number} width={s.w as number} height={s.h as number} rx={(s.r as number) ?? 0} fill={fill} stroke={stroke} />;
	if (s.t === 'ellipse') return <ellipse cx={s.cx as number} cy={s.cy as number} rx={s.rx as number} ry={s.ry as number} fill={fill} stroke={stroke} />;
	if (s.t === 'poly') return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />;
	if (s.t === 'line') return <polyline points={pts} fill="none" stroke={stroke ?? fill} strokeWidth={sw || 1.5} strokeLinecap="round" strokeLinejoin="round" />;
	return <path d={s.d as string} fill={fill} stroke={stroke} strokeWidth={sw} />;
};

/** Idle life per layer name: torso breathes, head bobs (and nods while speaking), arms sway, shadow pulses. */
const layerMotion = (name: string, f: number, talking: boolean, depth: number): string => {
	const T = (period: number, phase = 0) => Math.sin((2 * Math.PI * f) / period + phase);
	if (/torso|body|chest/.test(name)) return `translateY(${(-0.4 * T(90)).toFixed(3)}px) scale(1, ${(1 + 0.012 * T(90)).toFixed(4)})`;
	if (/head|face|hair|eye|mouth|brow/.test(name)) return `translate(${(0.3 * T(140, 1)).toFixed(3)}px, ${(-0.6 * T(90, 0.6) - (talking ? 0.8 * Math.abs(Math.sin(f * 0.45)) : 0)).toFixed(3)}px) rotate(${(1.2 * T(120)).toFixed(3)}deg)`;
	if (/arm|hand/.test(name)) return `rotate(${(3 * T(75, depth)).toFixed(3)}deg)`;
	if (/shadow/.test(name)) return `scale(${(1 - 0.02 * T(90)).toFixed(4)}, 1)`;
	return `translateY(${(-0.3 * T(110, depth)).toFixed(3)}px)`;
};

const CastFigure: React.FC<{r: R; c: CastEntry; at: PanelDefM['cast'][number]; f: number; talking: boolean}> = ({r, c, at, f, talking}) => {
	const pop = springPopIn(f, {start: at.from ?? 0, spring: c.role === 'prop' ? 'snappy' : 'bouncy', from: 0.85, rise: 30 * r.k});
	const layers = [...c.layers].sort((x, y) => (x.depth ?? 0) - (y.depth ?? 0));
	return (
		<div style={{position: 'absolute', ...pctPx(at.box, r.W, r.H), opacity: pop.opacity, transform: `translateY(${pop.y.toFixed(2)}px) scale(${at.flip ? -pop.scale : pop.scale}, ${pop.scale})`, transformOrigin: '50% 100%'}}>
			<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMax meet" width="100%" height="100%" style={{overflow: 'visible'}}>
				{layers.map((l) => (
					<g key={l.name} style={{transform: c.role === 'prop' ? undefined : layerMotion(l.name, f, talking, l.depth ?? 0), transformBox: 'fill-box', transformOrigin: /arm|hand/.test(l.name) ? '20% 10%' : '50% 100%'}}>
						{l.shapes.map((s, i) => (
							<Shape key={i} s={s} r={r} />
						))}
					</g>
				))}
			</svg>
		</div>
	);
};

// ------------------------------------------------------------------ micro-widgets
const WidgetMount: React.FC<{id: string; tk: unknown; box: Pct; props: Record<string, unknown>; frames: number}> = ({id, tk, box, props, frames}) => {
	const local = useCurrentFrame();
	const e = WIDGETS[id];
	if (!e) throw new Error(`film-studio: widget "${id}" is not in components/widgets/registry.ts`);
	const C = e.Component;
	return <C tk={tk} frame={Math.min(local, Math.max(frames, e.frames) - 1)} box={box} {...props} />;
};

// ------------------------------------------------------------------ bespoke topic scenes (colours, fonts and easings still come from the one design system)
const BespokeMount: React.FC<{id: string; r: R; box: Pct; props: Record<string, unknown>; frames: number}> = ({id, r, box, props, frames}) => {
	const local = useCurrentFrame();
	const C = BESPOKE[id];
	if (!C) throw new Error(`film-studio: bespoke scene "${id}" is not in components/bespoke/registry.ts`);
	// props.offset (frames) continues a scene across a cut: the second panel picks up where the first left off
	const offset = Number(props.offset ?? 0);
	const kit = makeKit({frame: local + offset, frames: frames + offset, fps: r.m.meta.fps, box: pctPx(box, r.W, r.H), k: r.k, role: r.role, pairing: r.pairing, easings: r.ds.motion?.easings ?? {}, springs: r.ds.motion?.springs, props});
	if (props.bare) return <C kit={kit} />;
	// every bespoke scene sits on its own hero card (gradient, border, shadow) so the diagram never floats on a void
	const px = pctPx(box, r.W, r.H), pad = 18 * r.k, dark = isDark(r.roles.bg);
	const surf = roleOr(r, 'surface', 'shadow', 'bg');
	return (
		<>
			<div style={{position: 'absolute', left: px.left - pad, top: px.top - pad, width: px.width + 2 * pad, height: px.height + 2 * pad, borderRadius: 28 * r.k, background: `linear-gradient(165deg, ${alpha(surf, dark ? 0.82 : 0.9)} 0%, ${alpha(r.roles.bg, 0.72)} 100%)`, border: `${2 * r.k}px solid ${alpha(r.roles.primary, 0.32)}`, boxShadow: `0 ${30 * r.k}px ${80 * r.k}px ${alpha('#000000', dark ? 0.6 : 0.2)}, inset 0 ${2 * r.k}px 0 ${alpha(r.roles.ink, 0.08)}`, opacity: clamp01(local / 8)}} />
			<C kit={kit} />
		</>
	);
};

// ------------------------------------------------------------------ 1. atmosphere layer (never an empty frame)
const Atmosphere: React.FC<{r: R; f: number}> = ({r, f}) => {
	const {W, H, k} = r, dark = isDark(r.roles.bg), ink = r.roles.ink, pri = r.roles.primary, hi = roleOr(r, 'highlight', 'secondary', 'primary');
	const surf = roleOr(r, 'surface', 'shadow', 'bg'), cell = 90 * k, off = (f * 0.35 * k) % cell, T = (p: number, ph = 0) => Math.sin((2 * Math.PI * f) / p + ph);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<AbsoluteFill style={{background: `radial-gradient(120% 70% at 50% 18%, ${alpha(pri, dark ? 0.2 : 0.12)} 0%, ${r.roles.bg} 55%), linear-gradient(180deg, ${r.roles.bg} 0%, ${alpha(surf, 0.85)} 100%)`}} />
			<div style={{position: 'absolute', left: W * (0.12 + 0.05 * T(400)), top: H * (0.2 + 0.04 * T(330, 1)), width: W * 0.8, height: W * 0.8, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(pri, dark ? 0.22 : 0.14)} 0%, ${alpha(pri, 0)} 70%)`}} />
			<div style={{position: 'absolute', left: W * (0.35 + 0.06 * T(470, 2)), top: H * (0.55 + 0.05 * T(390)), width: W * 0.7, height: W * 0.7, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(hi, dark ? 0.16 : 0.1)} 0%, ${alpha(hi, 0)} 70%)`}} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<defs>
					<pattern id="fs-grid" width={cell} height={cell} patternUnits="userSpaceOnUse" patternTransform={`translate(${off.toFixed(2)} ${off.toFixed(2)})`}>
						<path d={`M ${cell} 0 L 0 0 0 ${cell}`} fill="none" stroke={alpha(ink, dark ? 0.07 : 0.06)} strokeWidth={1.5 * k} />
					</pattern>
					<filter id="fs-grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={Math.floor(f / 2) % 97} /><feColorMatrix type="saturate" values="0" /></filter>
				</defs>
				<rect width={W} height={H} fill="url(#fs-grid)" />
				<rect width={W} height={H} filter="url(#fs-grain)" opacity={dark ? 0.07 : 0.09} style={{mixBlendMode: dark ? 'screen' : 'multiply'}} />
			</svg>
			<AbsoluteFill style={{background: `radial-gradient(110% 80% at 50% 45%, ${alpha('#000000', 0)} 55%, ${alpha(dark ? '#000000' : ink, dark ? 0.55 : 0.16)} 100%)`}} />
		</AbsoluteFill>
	);
};

// ------------------------------------------------------------------ one panel
const panelMotion = (p: PanelDefM, local: number, f: number, r: R) => {
	const tf: string[] = [];
	let blur = 0;
	const t = p.transition;
	if (t && t.primitive !== 'cut' && local <= t.frames + 1) {
		if (t.primitive === 'whip-pan') {
			const s = directionalWhipPan(0, {start: 0, frames: t.frames}).swapFrame;
			const w = directionalWhipPan(local + s, {start: 0, frames: t.frames});
			if (!w.landed) { tf.push(w.incoming.transform); blur = w.blur * 0.5; }
		} else if (t.primitive === 'axis-flip') {
			const fl = axisFlip3D(local + Math.round(t.frames / 2), {start: 0, frames: t.frames, mode: 'swap'});
			tf.push(`perspective(${fl.parentStyle.perspective}) ${fl.transform}`);
		} else if (t.primitive === 'pull-back-zoom') tf.push(`scale(${elasticPullBackZoom(local, {start: 0}).scale.toFixed(4)})`);
		else if (t.primitive === 'dolly-push') tf.push(simulatedDollyPush(local, {start: 0, frames: t.frames}).transform);
	}
	for (const m of p.motion.filter((x) => (x.target ?? 'panel') === 'panel' && f >= x.frame)) {
		if (m.primitive === 'dolly-push') tf.push(simulatedDollyPush(f, {start: m.frame, frames: m.frames ?? 60}).transform);
		else if (m.primitive === 'pull-back-zoom') tf.push(`scale(${elasticPullBackZoom(f, {start: m.frame}).scale.toFixed(4)})`);
		else if (m.primitive === 'spring-overshoot') tf.push(`scale(${springPopIn(f, {start: m.frame, spring: 'snappy', from: 0.96}).scale.toFixed(4)})`);
		else if (m.primitive === 'stop-motion-jitter') { const j = stopMotionSteppedJitter(f, {start: m.frame, end: m.frame + (m.frames ?? 60), seed: `${r.seed}-${p.id}`}); if (j.active) tf.push(j.transform); }
		else if (m.primitive === 'whip-pan') { const w = directionalWhipPan(f, {start: m.frame, frames: m.frames ?? 10}); if (!w.landed) { tf.push(w.outgoing.transform); blur = w.blur * 0.5; } }
	}
	for (const bt of p.beats.filter((x) => !x.target && x.kind === 'camera')) tf.push(`scale(${(1 + 0.04 * clamp01((f - bt.frame) / Math.max(1, bt.frames ?? 30))).toFixed(4)})`);
	return {transform: tf.join(' ') || undefined, filter: blur > 0.2 ? `blur(${blur.toFixed(2)}px)` : undefined};
};

const PanelView: React.FC<{p: PanelDefM; r: R; castById: Map<string, CastEntry>; tokens: (fam: WidgetFamily) => unknown; talking: (f: number) => boolean}> = ({p, r, castById, tokens, talking}) => {
	const local = useCurrentFrame();
	const f = p.from + local;
	const pm = panelMotion(p, local, f, r);
	// continuous camera push-in: scale 1.00 -> 1.08 across the panel, eased, so the hero never sits still
	const push = `scale(${(1 + 0.08 * smooth(local / Math.max(1, p.frames - 1))).toFixed(4)})`;
	const gate = p.motion.find((x) => x.primitive === 'film-gate' && f >= x.frame);
	const g = gate ? filmGateFlicker(f, {start: gate.frame, seed: `${r.seed}-${p.id}`}) : null;
	const boxes = p.boxes;
	let node: React.ReactNode = (
		<AbsoluteFill style={{transform: [push, pm.transform, g?.weaveTransform].filter(Boolean).join(' '), filter: pm.filter, transformOrigin: '50% 45%'}}>
			{boxes.filter((b) => b.kind === 'card').map((b, i) => <CardBox key={b.id} r={r} b={b} f={f} p={p} i={i} />)}
			{p.cast.map((c) => { const e = castById.get(c.id); return e ? <CastFigure key={c.id} r={r} c={e} at={c} f={f} talking={e.role === 'narrator' && talking(f)} /> : null; })}
			{boxes.filter((b) => b.kind === 'text').map((b, i) => <TextBox key={b.id} r={r} b={b} i={i} f={f} p={p} />)}
			{(p.bespoke ?? []).map((b, i) => (
				<Sequence key={`bespoke-${b.id}-${i}`} from={b.from - p.from} durationInFrames={b.frames} layout="none">
					<BespokeMount id={b.id} r={r} box={b.box} props={b.props} frames={b.frames} />
				</Sequence>
			))}
			{p.widgets.map((w, i) => (
				<Sequence key={`${w.id}-${i}`} from={w.from - p.from} durationInFrames={w.frames} layout="none">
					<WidgetMount id={w.id} tk={tokens(WIDGETS[w.id]?.family ?? 'social')} box={w.box} props={w.props} frames={w.frames} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
	for (const fx of p.fx ?? []) {
		const Fx = EFFECTS[fx.id];
		if (!Fx) throw new Error(`film-studio: effect "${fx.id}" has no component in components/effects/`);
		node = <Fx t={local} start={fx.from - p.from} dur={fx.frames} panelDur={p.frames} params={fx.params ?? {}}>{node}</Fx>;
	}
	return (
		<AbsoluteFill>
			{node}
			{g ? (
				<AbsoluteFill style={{pointerEvents: 'none'}}>
					<AbsoluteFill style={{background: `rgba(0,0,0,${g.overlayAlpha.toFixed(4)})`}} />
					<svg width={r.W} height={r.H} style={{position: 'absolute', inset: 0}}>
						{g.specks.map((s, i) => <circle key={i} cx={s.x * r.W} cy={s.y * r.H} r={s.r * r.k} fill={s.dark ? r.role('ink') : r.role('bg')} opacity={s.alpha} />)}
						{g.scratch.visible ? <rect x={g.scratch.x * r.W} y={0} width={g.scratch.width * r.k} height={r.H} fill={r.role('bg')} opacity={g.scratch.alpha} /> : null}
					</svg>
				</AbsoluteFill>
			) : null}
		</AbsoluteFill>
	);
};

// ------------------------------------------------------------------ captions (5-word chunks, active word highlight)
// centre stage, inside the 9:16 safe area (x 6 to 85, above the bottom 20%)
const DEFAULT_CAPTION: Pct = {x: 6, y: 62, w: 79, h: 14};
const CAPTION_MIN_PX = 64;
const Captions: React.FC<{r: R; f: number}> = ({r, f}) => {
	const {m} = r;
	const c = captionAt(m.captions, f);
	if (!c) return null;
	const p = m.panels.find((x) => f >= x.from && f < x.from + x.frames);
	const cb = p?.boxes.find((b) => b.kind === 'caption');
	const box = cb ?? DEFAULT_CAPTION;
	const words = c.text.split(/\s+/).filter(Boolean);
	const per = (c.to - c.from) / words.length;
	const ms = (fr: number) => (fr / m.meta.fps) * 1000;
	const hl = activeWordHighlight(f, {fps: m.meta.fps, words: words.map((w, i) => ({text: w, startMs: ms(c.from + i * per), endMs: ms(c.from + (i + 1) * per)})), power: c.power ? words.map((w, i) => (w.replace(/[^\w'-]/g, '') === c.power!.replace(/[^\w'-]/g, '') ? i : -1)).filter((i) => i >= 0) : []});
	const pop = springPopIn(f, {start: c.from, spring: 'snappy', from: 0.92, rise: 10 * r.k});
	const bg = cb?.bg ?? 'bg';
	const ink = r.role(cb?.color ?? 'ink');
	const accent = contrast(r.role('primary'), r.role(bg)) >= 4.5 ? r.role('primary') : ink;
	const font = fontCss(r.pairing[cb?.font ?? 'display'], Math.max(CAPTION_MIN_PX, cb?.px ?? r.ds.type_scale?.caption ?? CAPTION_MIN_PX) * r.k);
	const plate = bg !== 'bg' ? r.role(bg) : alpha(r.roles.bg, 0.62);
	const shadow = `0 ${4 * r.k}px ${18 * r.k}px ${alpha(isDark(r.roles.bg) ? '#000000' : r.roles.bg, 0.85)}`;
	return (
		<div style={{position: 'absolute', ...pctPx(box, r.W, r.H), display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: pop.opacity, transform: `translateY(${pop.y.toFixed(2)}px) scale(${pop.scale.toFixed(4)})`}}>
			<div style={{...font, textAlign: 'center', justifyContent: 'center', background: plate, borderRadius: 22 * r.k, padding: `${10 * r.k}px ${26 * r.k}px`, boxShadow: `0 ${12 * r.k}px ${40 * r.k}px ${alpha('#000000', 0.35)}`, display: 'flex', flexWrap: 'wrap', gap: `0 ${0.32 * (font.fontSize as number)}px`, textShadow: shadow}}>
				{hl.words.map((w) => {
					const on = w.state === 'active' ? w.t : 0;
					return (
						<span key={w.index} style={{color: w.power ? accent : ink, transform: `translateY(${(-6 * on * r.k).toFixed(2)}px) scale(${(1 + 0.12 * on).toFixed(4)})`, display: 'inline-block', textDecoration: w.state === 'active' && !w.power && accent === ink ? 'underline' : undefined}}>
							{w.text}
						</span>
					);
				})}
			</div>
		</div>
	);
};

// ------------------------------------------------------------------ 9:16 platform dead zones (review only)
const SafeZones: React.FC<{W: number; H: number}> = ({W, H}) => (
	<AbsoluteFill style={{pointerEvents: 'none'}}>
		<div style={{position: 'absolute', left: 0, top: H * 0.8, width: W, height: H * 0.2, background: 'rgba(255,0,64,0.28)', borderTop: '4px dashed rgba(255,0,64,0.9)'}} />
		<div style={{position: 'absolute', left: W * 0.85, top: 0, width: W * 0.15, height: H * 0.8, background: 'rgba(255,0,64,0.22)', borderLeft: '4px dashed rgba(255,0,64,0.9)'}} />
		<div style={{position: 'absolute', left: W * 0.06, top: H * 0.08, width: W * 0.79, height: H * 0.72, border: '3px dashed rgba(0,255,170,0.85)'}} />
	</AbsoluteFill>
);

// ------------------------------------------------------------------ the composition
const DRIFT_SPAN = 14;
export const FilmComposition: React.FC<RenderManifest> = (m) => {
	const frame = useCurrentFrame();
	const {width: W, height: H} = useVideoConfig();
	const ready = !!m.panels?.length && !!m.design?.style;
	const d = useMemo(() => (ready ? resolveDesign(m) : null), [ready, m]);
	const castById = useMemo(() => new Map((m.cast ?? []).map((c) => [c.id, c])), [m.cast]);
	const tkCache = useMemo(() => new Map<WidgetFamily, unknown>(), [m.design?.style, m.design?.palette_id, m.design?.pairing_id]);
	if (!ready || !d) return <AbsoluteFill style={{background: 'black'}} />;
	const k = W / 1080;
	const r: R = {...d, k, W, H, seed: m.design.seed, m};
	const tokens = (fam: WidgetFamily) => {
		if (!tkCache.has(fam)) tkCache.set(fam, WIDGET_TOKENS[fam](d.ds, m.design.palette_id, m.design.pairing_id));
		return tkCache.get(fam);
	};
	const segs = m.audio.voiceover?.segments ?? [];
	const talking = (f: number) => (segs.length ? segs.some(([a, b]) => f >= a && f <= b) : !!captionAt(m.captions, f));
	// The drift keeps its speed but folds back and forth inside DRIFT_SPAN px, so a long film never walks the stage
	// out of the safe zones (an unfolded 12 px/s drift travels about 500 px over 45 s).
	const raw = zeroDeadVelocityDrift(frame, {start: 0, end: m.meta.frames, seed: m.design.seed});
	const travel = Math.hypot(raw.x, raw.y), folded = DRIFT_SPAN - Math.abs((travel % (2 * DRIFT_SPAN)) - DRIFT_SPAN);
	const drift = {x: travel ? (raw.x / travel) * folded : 0, y: travel ? (raw.y / travel) * folded : 0, scale: raw.scale};
	const sf = m.meta.safe;
	const ctx = {
		design: {style: m.design.style, palette: {id: m.design.palette_id, roles: d.roles}, fonts: d.pairing, seed: m.design.seed, system: d.ds} as unknown as Design,
		meta: m.meta as unknown as FilmDef['meta'],
		cast: {} as FilmDef['cast'],
		u: Math.min(W, H) / 100,
		W,
		H,
		safe: {x: sf.left * k, y: sf.top * k, w: W - (sf.left + sf.right) * k, h: H - (sf.top + sf.bottom) * k},
	};
	const music = m.audio.music;
	return (
		<DesignProvider value={ctx}>
			<FontGate fonts={d.pairing}>
				<AbsoluteFill style={{background: d.role('bg'), overflow: 'hidden'}}>
					<svg width={0} height={0} style={{position: 'absolute'}}>
						<filter id="fs-ch-r" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values={CHANNEL_MATRIX.r} /></filter>
						<filter id="fs-ch-b" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values={CHANNEL_MATRIX.b} /></filter>
					</svg>
					<Atmosphere r={r} f={frame} />
					<AbsoluteFill style={{transform: `translate(${(drift.x * k).toFixed(2)}px, ${(drift.y * k).toFixed(2)}px) scale(${drift.scale.toFixed(4)})`}}>
						{m.panels.map((p) => (
							<Sequence key={p.id} from={p.from} durationInFrames={p.frames}>
								<PanelView p={p} r={r} castById={castById} tokens={tokens} talking={talking} />
							</Sequence>
						))}
					</AbsoluteFill>
					<Captions r={r} f={frame} />
					{m.showSafeZones ? <SafeZones W={W} H={H} /> : null}
				</AbsoluteFill>
				{m.audio.mix ? <Audio src={staticFile(m.audio.mix.file)} /> : null}
				{m.audio.mix ? null : m.audio.sfx.filter((c) => c.file).map((c, i) => (
					<Sequence key={`sfx-${i}`} from={c.frame} layout="none">
						<Audio src={staticFile(c.file as string)} volume={(f) => dbToGain(c.db) * (segs.some(([a, b]) => c.frame + f >= a && c.frame + f <= b) ? (m.audio.sfx_duck ?? 1) : 1)} />
					</Sequence>
				))}
				{m.audio.mix ? null : (m.audio.voiceover?.clips ?? []).map((c, i) => (
					<Sequence key={`vo-${i}`} from={c.from} layout="none">
						<Audio src={staticFile(c.file)} />
					</Sequence>
				))}
				{music && !m.audio.mix ? <Audio src={staticFile(music.file)} loop volume={(f) => duckedMusicGain(f, music, segs)} /> : null}
			</FontGate>
		</DesignProvider>
	);
};

/** An empty manifest for the Studio default: renders black until real props are passed. */
export const EMPTY_MANIFEST: RenderManifest = {
	version: 1,
	meta: {title: 'empty', platform: 'instagram', ratio: '9:16', fps: 30, width: 1080, height: 1920, frames: 30, safe: {top: 0, right: 0, bottom: 0, left: 0}},
	design: {style: '', palette_id: '', palette_tier: 'focused', palette_size: 5, pairing_id: '', seed: 'empty'},
	subject_mode: 'ui-first',
	cast: [],
	panels: [],
	captions: [],
	audio: {sfx: [], voiceover: null, music: null},
	showSafeZones: false,
};
