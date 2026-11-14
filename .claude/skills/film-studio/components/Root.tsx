import React from 'react';
import {Composition} from 'remotion';
import type {FilmDef} from './engine/types';
import {Film, Sheet, filmFrames, sheetSize} from './engine/Film';
import {NokiaBaseline} from './baseline/NokiaBaseline';
import {CatsBaseline} from './baseline/CatsBaseline';
import {CrisisBaseline} from './baseline/CrisisBaseline';
import {Preview as HormoziPreview, PreviewSheet as HormoziSheet, PREVIEW_FRAMES as HORMOZI_FRAMES, SHEET_SIZE as HORMOZI_SHEET} from './styles/hormozi-kinetic/Preview';

const empty = {meta: {title: '', platform: 'instagram', ratio: '9:16', fps: 30, width: 1080, height: 1920, safe: {top: 0, right: 0, bottom: 0, left: 0}}, design: {}, cast: {}, scenes: []} as unknown as FilmDef;

/**
 * `Film` is the only production composition: its props are work/film.json (scripts/build-film.js).
 * The Baseline-* compositions are the untouched plain-prompt reference this skill must beat.
 */
export const Root: React.FC = () => (
	<>
		<Composition
			id="Film"
			component={Film as unknown as React.FC<Record<string, unknown>>}
			durationInFrames={30}
			fps={30}
			width={1080}
			height={1920}
			defaultProps={empty as unknown as Record<string, unknown>}
			calculateMetadata={({props}) => {
				const f = props as unknown as FilmDef;
				return {width: f.meta.width, height: f.meta.height, fps: f.meta.fps, durationInFrames: Math.max(1, filmFrames(f))};
			}}
		/>
		<Composition
			id="Sheet"
			component={Sheet as unknown as React.FC<Record<string, unknown>>}
			durationInFrames={1}
			fps={30}
			width={1080}
			height={1920}
			defaultProps={empty as unknown as Record<string, unknown>}
			calculateMetadata={({props}) => {
				const z = sheetSize(props as unknown as FilmDef);
				return {width: z.width, height: z.height, fps: 30, durationInFrames: 1};
			}}
		/>
		<Composition id="Preview-hormozi-kinetic" component={HormoziPreview} durationInFrames={HORMOZI_FRAMES} fps={30} width={1080} height={1920} defaultProps={{palette: 'blackout-gold', pairing: 'anton-inter'}} />
		<Composition id="PreviewSheet-hormozi-kinetic" component={HormoziSheet} durationInFrames={HORMOZI_FRAMES} fps={30} width={HORMOZI_SHEET.width} height={HORMOZI_SHEET.height} defaultProps={{palette: 'blackout-gold', pairing: 'anton-inter'}} />
		<Composition id="Baseline-nokia" component={NokiaBaseline} durationInFrames={1350} fps={30} width={1080} height={1920} />
		<Composition id="Baseline-cats" component={CatsBaseline} durationInFrames={900} fps={30} width={1080} height={1920} />
		<Composition id="Baseline-crisis" component={CrisisBaseline} durationInFrames={1800} fps={30} width={1920} height={1080} />
	</>
);
