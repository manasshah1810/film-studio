import React from 'react';
import {AbsoluteFill, Audio, Sequence, Series, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Design, FilmDef, PanelDef} from './types';
import {DesignProvider} from './tokens';
import {FontGate} from './fonts';
import {Panel} from './Panel';
import {KITS} from '../styles';
import {EFFECTS} from '../effects';

export const panelFrames = (p: PanelDef, fps: number) => Math.max(1, Math.round(p.duration * fps));
export const filmFrames = (film: FilmDef) => film.scenes.reduce((a, s) => a + s.panels.reduce((b, p) => b + panelFrames(p, film.meta.fps), 0), 0);

const PanelShot: React.FC<{panel: PanelDef; dur: number; style: string}> = ({panel, dur, style}) => {
	const t = useCurrentFrame();
	const {fps} = useVideoConfig();
	const kit = KITS[style];
	if (!kit) throw new Error(`film-studio: no kit for style "${style}"`);
	let node: React.ReactNode = <Panel panel={panel} kit={kit} t={t} dur={dur} />;
	// effects wrap the panel, innermost first; an unknown id throws (library only)
	for (const fx of panel.fx ?? []) {
		const Fx = EFFECTS[fx.id];
		if (!Fx) throw new Error(`film-studio: effect "${fx.id}" has no component in effects/`);
		node = (
			<Fx t={t} start={Math.round(fx.start * fps)} dur={Math.max(1, Math.round(fx.duration * fps))} panelDur={dur} params={fx.params ?? {}}>
				{node}
			</Fx>
		);
	}
	return <AbsoluteFill>{node}</AbsoluteFill>;
};

/** The one composition. Everything on screen comes from the film JSON; there is no per-film code. */
export const Film: React.FC<FilmDef> = (film) => {
	const {width: W, height: H, fps} = useVideoConfig();
	if (!film.design?.system) throw new Error('film-studio: film.design.system missing (build film.json with scripts/build-film.js)');
	const k = W / film.meta.width;
	const sf = film.meta.safe;
	const safe = {x: sf.left * k, y: sf.top * k, w: W - (sf.left + sf.right) * k, h: H - (sf.top + sf.bottom) * k};
	const ctx = {design: film.design as Design, meta: film.meta, cast: film.cast, u: Math.min(W, H) / 100, W, H, safe};
	return (
		<DesignProvider value={ctx}>
			<FontGate fonts={film.design.fonts}>
				<AbsoluteFill style={{background: film.design.palette.roles.bg}}>
					<Series>
						{film.scenes.flatMap((s) =>
							s.panels.map((p) => {
								const d = panelFrames(p, fps);
								return (
									<Series.Sequence key={p.id} durationInFrames={d}>
										<PanelShot panel={p} dur={d} style={film.design.style} />
									</Series.Sequence>
								);
							}),
						)}
					</Series>
				</AbsoluteFill>
				{(film.audio ?? []).map((a) => (
					<Sequence key={a.file} from={Math.round(a.start * fps)}>
						<Audio src={staticFile(a.file)} />
					</Sequence>
				))}
			</FontGate>
		</DesignProvider>
	);
};

/** Contact sheet: every panel frozen at `at` of its duration, in a grid. Review tool only (scripts/preview.js --sheet). */
export const sheetSize = (film: FilmDef & {sheet?: {cols?: number; cell?: number}}) => {
	const n = film.scenes.reduce((a, s) => a + s.panels.length, 0) || 1;
	const cols = film.sheet?.cols ?? Math.min(n, 5);
	const s = (film.sheet?.cell ?? 360) / film.meta.width;
	return {cols, s, width: Math.round(cols * film.meta.width * s), height: Math.round(Math.ceil(n / cols) * film.meta.height * s)};
};
export const Sheet: React.FC<FilmDef & {sheet?: {cols?: number; cell?: number; at?: number}}> = (film) => {
	if (!film.design?.system) throw new Error('film-studio: film.design.system missing');
	const {cols, s} = sheetSize(film);
	const W = film.meta.width, H = film.meta.height, sf = film.meta.safe;
	const ctx = {design: film.design as Design, meta: film.meta, cast: film.cast, u: Math.min(W, H) / 100, W, H, safe: {x: sf.left, y: sf.top, w: W - sf.left - sf.right, h: H - sf.top - sf.bottom}};
	const kit = KITS[film.design.style];
	if (!kit) throw new Error(`film-studio: no kit for style "${film.design.style}"`);
	const panels = film.scenes.flatMap((sc) => sc.panels);
	return (
		<DesignProvider value={ctx}>
			<FontGate fonts={film.design.fonts}>
				<AbsoluteFill style={{background: '#000'}}>
					{panels.map((p, i) => {
						const d = panelFrames(p, film.meta.fps);
						return (
							<div key={p.id} style={{position: 'absolute', left: (i % cols) * W * s, top: Math.floor(i / cols) * H * s, width: W, height: H, transform: `scale(${s})`, transformOrigin: '0 0', overflow: 'hidden', background: film.design.palette.roles.bg}}>
								<Panel panel={p} kit={kit} t={Math.min(d - 1, Math.round(d * (film.sheet?.at ?? 0.85)))} dur={d} />
							</div>
						);
					})}
				</AbsoluteFill>
			</FontGate>
		</DesignProvider>
	);
};
