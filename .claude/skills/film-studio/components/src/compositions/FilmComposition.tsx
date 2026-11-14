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
 * Layers, back to front: background, camera drift (Zero Dead Velocity), panels (transition, boxes, motion
 * primitives, layered cast, micro-widgets, VFX wrappers), captions, film-gate texture, safe-zone overlay.
 * Audio: SFX on their frames, voiceover clips, music ducked under the voice.
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

const pctPx = (b: Pct, W: number, H: number) => ({left: (b.x / 100) * W, top: (b.y / 100) * H, width: (b.w / 100) * W, height: (b.h / 100) * H});
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
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
	const enterAt = (b.from ?? p.from) + i * (r.ds.motion?.stagger_frames ?? 4);
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
	const border = t.border?.width ? `${t.border.width * r.k}px solid ${r.role(t.border.role ?? 'ink')}` : undefined;
	return <div style={{position: 'absolute', ...pctPx(b, r.W, r.H), background: r.role(b.bg ?? 'surface'), borderRadius: (t.radius ?? 0) * r.k, border, opacity: pop.opacity, transform: `scale(${pop.scale.toFixed(4)})`}} />;
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
	const gate = p.motion.find((x) => x.primitive === 'film-gate' && f >= x.frame);
	const g = gate ? filmGateFlicker(f, {start: gate.frame, seed: `${r.seed}-${p.id}`}) : null;
	const boxes = p.boxes;
	let node: React.ReactNode = (
		<AbsoluteFill style={{transform: [pm.transform, g?.weaveTransform].filter(Boolean).join(' ') || undefined, filter: pm.filter, transformOrigin: '50% 50%'}}>
			{boxes.filter((b) => b.kind === 'card').map((b, i) => <CardBox key={b.id} r={r} b={b} f={f} p={p} i={i} />)}
			{p.cast.map((c) => { const e = castById.get(c.id); return e ? <CastFigure key={c.id} r={r} c={e} at={c} f={f} talking={e.role === 'narrator' && talking(f)} /> : null; })}
			{boxes.filter((b) => b.kind === 'text').map((b, i) => <TextBox key={b.id} r={r} b={b} i={i} f={f} p={p} />)}
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
const DEFAULT_CAPTION: Pct = {x: 8, y: 66, w: 74, h: 10};
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
	const font = fontCss(r.pairing[cb?.font ?? 'display'], (cb?.px ?? r.ds.type_scale?.caption ?? 56) * r.k);
	return (
		<div style={{position: 'absolute', ...pctPx(box, r.W, r.H), display: 'flex', alignItems: 'center', opacity: pop.opacity, transform: `translateY(${pop.y.toFixed(2)}px) scale(${pop.scale.toFixed(4)})`}}>
			<div style={{...font, background: bg !== 'bg' ? r.role(bg) : undefined, padding: bg !== 'bg' ? `${8 * r.k}px ${16 * r.k}px` : 0, display: 'flex', flexWrap: 'wrap', gap: `0 ${0.28 * (font.fontSize as number)}px`}}>
				{hl.words.map((w) => (
					<span key={w.index} style={{color: w.power ? accent : ink, transform: `scale(${(1 + 0.08 * (w.state === 'active' ? w.t : 0)).toFixed(4)})`, display: 'inline-block', textDecoration: w.state === 'active' && !w.power && accent === ink ? 'underline' : undefined}}>
						{w.text}
					</span>
				))}
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
	// Drift restarts on every panel: one pan across the whole film accumulates 400+ px at the library's minimum speed and pushes content off the frame.
	const dp = m.panels.find((q) => frame >= q.from && frame < q.from + q.frames) ?? m.panels[0];
	const drift = zeroDeadVelocityDrift(frame - dp.from, {start: 0, end: Math.max(2, dp.frames), seed: `${m.design.seed}-${dp.id}`});
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
				{m.audio.sfx.filter((c) => c.file).map((c, i) => (
					<Sequence key={`sfx-${i}`} from={c.frame} layout="none">
						<Audio src={staticFile(c.file as string)} volume={dbToGain(c.db)} />
					</Sequence>
				))}
				{(m.audio.voiceover?.clips ?? []).map((c, i) => (
					<Sequence key={`vo-${i}`} from={c.from} layout="none">
						<Audio src={staticFile(c.file)} />
					</Sequence>
				))}
				{music ? <Audio src={staticFile(music.file)} loop volume={(f) => duckedMusicGain(f, music, segs)} /> : null}
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
