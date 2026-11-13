import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {CastDef, Kit, PanelDef, Role, Shape, Zone, Zones} from './types';
import {enterP, useD, useEnterEase} from './tokens';
import {cut, zonesFor} from './layout';
import {measureKind} from './text';
import {buildFigure, FIG_VB} from './figure';
import {getProp, withState} from './props';

/** Resolve a cast id to shapes. Unknown ids throw: a panel can only show approved cast. */
export const useCastShapes = () => {
	const {cast, design} = useD();
	return (id: string, pose?: any, expr?: any, state?: string): {shapes: Shape[]; vb: [number, number]; kind: 'figure' | 'prop'} => {
		const c: CastDef | undefined = cast[id];
		if (!c) throw new Error(`film-studio: cast id "${id}" is not in film.cast`);
		if (c.kind === 'character') return {shapes: buildFigure(c, pose, expr, design.system.figure), vb: FIG_VB, kind: 'figure'};
		if (c.kind === 'prop') return {shapes: withState(getProp(id, c), state), vb: c.vb ?? [100, 100], kind: 'prop'};
		throw new Error(`film-studio: cast id "${id}" is media, not drawable`);
	};
};

/** Shared assembly: places kit elements into zones for each layout. A kit may override any layout. */
export const Panel: React.FC<{panel: PanelDef; kit: Kit; t: number; dur: number}> = ({panel, kit, t, dur}) => {
	const {design, safe, u, W, H} = useD();
	const sys = design.system;
	const ease = useEnterEase();
	const get = useCastShapes();
	const m = sys.composition.margin * u;
	let frame: Zone = {x: safe.x + m, y: safe.y + m, w: safe.w - 2 * m, h: safe.h - 2 * m};
	let capZone: Zone | undefined;
	if (panel.caption) [capZone, frame] = cut(frame, 'b', 0.09, u * 2);
	let z: Zones = zonesFor(panel, frame, H > W, sys.composition.anchors, design.seed, u, (text, kind, w, k) => measureKind(design, u, text, kind, w, k));
	if (kit.zones) z = kit.zones(z, panel, frame);
	const s = panel.slots;
	// only free-standing text blocks may flip to the right edge; structured layouts keep the style's alignment
	const flips = ['title', 'stat', 'object', 'quote', 'figure'].includes(panel.layout);
	const align = flips && z._anchor.x === 1 && sys.composition.align !== 'center' ? 'right' : sys.composition.align;
	const accent: Role = panel.accent ?? 'primary';
	let i = 0;
	const el = (zone: Zone, key: string) => ({zone, p: enterP(t, i++, sys.motion, ease), t, seed: `${design.seed}-${panel.id}-${key}`});
	const Override = kit.layouts?.[panel.layout];
	const visual = (zone: Zone | undefined, key = 'v') => {
		if (!zone) return null;
		const cs = s.cast ?? [];
		const items: React.ReactNode[] = [];
		const n = cs.length + (s.prop ? 1 : 0);
		if (!n) return null;
		const w = zone.w / n;
		let k = 0;
		const flipAll = z._anchor.x === 0; // text on the left: figures on the right face left, toward the text
		cs.forEach((c, ci) => {
			const g = get(c.id, c.pose, c.expr);
			const zn = {x: zone.x + (flipAll ? k : n - 1 - k) * w, y: zone.y, w, h: zone.h};
			k++;
			const flip = c.flip ?? (cs.length > 1 ? ci === (flipAll ? 1 : 0) : flipAll);
			items.push(<kit.Marks key={key + ci} {...el(zn, key + ci)} {...g} flip={flip} />);
			if (c.says && kit.Bubble && z.bubble) items.push(<kit.Bubble key={key + ci + 'b'} {...el(z.bubble, key + 'b')} text={c.says} tail={flipAll ? 'right' : 'left'} />);
		});
		if (s.prop) {
			const g = get(s.prop.id, undefined, undefined, s.prop.state);
			const small = s.prop.state === 'small' || cs.length > 0;
			const zn = {x: zone.x + (flipAll ? k : n - 1 - k) * w, y: zone.y, w, h: zone.h};
			const pz = small ? {x: zn.x + zn.w * 0.12, y: zn.y + zn.h * 0.45, w: zn.w * 0.76, h: zn.h * 0.55} : zn;
			items.push(<kit.Marks key={key + 'p'} {...el(pz, key + 'p')} {...g} state={s.prop.state} />);
		}
		return items;
	};
	const body = Override ? (
		<Override panel={panel} zones={z} t={t} dur={dur} />
	) : (
		<>
			{s.kicker && z.kicker ? <kit.Label {...el(z.kicker, 'k')} text={s.kicker} kind="kicker" align={align} accent={accent} /> : null}
			{panel.layout === 'stat' && s.stat ? <kit.Numeral {...el(z.numeral, 'n')} value={s.stat.value} unit={s.stat.unit} align={align} accent={accent} /> : null}
			{panel.layout === 'stat' && s.stat?.label && z.label ? <kit.Label {...el(z.label, 'l')} text={s.stat.label} kind="label" align={align} accent={accent} /> : null}
			{s.headline && z.headline ? <kit.Headline {...el(z.headline, 'h')} text={s.headline} emphasis={s.emphasis} level={panel.layout === 'title' ? 'hero' : panel.layout === 'stat' ? 'h2' : 'h1'} align={align} accent={accent} /> : null}
			{s.sub && z.sub ? <kit.Label {...el(z.sub, 's')} text={s.sub} kind="sub" align={align} accent={accent} /> : null}
			{panel.layout === 'quote' && s.quote ? (
				<>
					<kit.Headline {...el(z.quote, 'q')} text={s.quote.text} emphasis={s.emphasis} level="h1" align={align} accent={accent} />
					{s.quote.by ? <kit.Label {...el(z.attrib, 'a')} text={s.quote.by} kind="attrib" align={align} accent={accent} /> : null}
				</>
			) : null}
			{panel.layout === 'chart' && s.chart ? <kit.Chart {...el(z.chart, 'c')} chart={s.chart} accent={accent} /> : null}
			{panel.layout !== 'versus' ? visual(z.visual) : null}
			{panel.layout === 'versus'
				? (s.sides ?? []).slice(0, 2).map((sd, k) => {
						const key = k ? 'sideB' : 'sideA';
						const g = sd.cast ? get(sd.cast, sd.pose, sd.expr) : sd.prop ? get(sd.prop) : null;
						const ac: Role = sd.win ? accent : 'ink';
						return (
							<React.Fragment key={key}>
								{g ? <kit.Marks {...el(z[key + '_v'], key)} {...g} flip={k === 1 && g.kind === 'figure'} state={sd.win === false ? 'dim' : undefined} /> : null}
								<kit.Label {...el(z[key + '_l'], key + 'l')} text={sd.label} kind="label" align="center" accent={ac} />
								{sd.value ? <kit.Numeral {...el(z[key + '_n'], key + 'n')} value={sd.value} align="center" accent={ac} /> : null}
							</React.Fragment>
						);
					})
				: null}
			{panel.layout === 'timeline'
				? (s.points ?? []).map((pt, k) => (
						<React.Fragment key={k}>
							<kit.Numeral {...el(z[`pt${k}w`], 'w' + k)} value={pt.when} align="left" accent={pt.hot ? accent : 'ink'} />
							<kit.Label {...el(z[`pt${k}t`], 't' + k)} text={pt.what} kind="body" align="left" accent={pt.hot ? accent : 'ink'} />
						</React.Fragment>
					))
				: null}
			{panel.layout === 'list' ? (s.items ?? []).map((it, k) => (
						<React.Fragment key={k}>
							<kit.Numeral {...el(z[`pt${k}w`], 'n' + k)} value={String(k + 1)} align="left" accent={accent} />
							<kit.Label {...el(z[`pt${k}t`], 'i' + k)} text={it} kind="body" align="left" accent="ink" />
						</React.Fragment>
					)) : null}
		</>
	);
	const decorP = enterP(t, 1, sys.motion, ease);
	return (
		<AbsoluteFill>
			<kit.Backdrop panel={panel} t={t} dur={dur} />
			{kit.Decor ? <kit.Decor panel={panel} zones={z} t={t} dur={dur} p={decorP} /> : null}
			{body}
			{capZone && panel.caption ? <kit.Label zone={capZone} p={1} t={t} seed={`${design.seed}-${panel.id}-cap`} text={panel.caption} kind="body" align="center" accent="ink" /> : null}
			{kit.Finish ? <kit.Finish panel={panel} t={t} dur={dur} /> : null}
		</AbsoluteFill>
	);
};
