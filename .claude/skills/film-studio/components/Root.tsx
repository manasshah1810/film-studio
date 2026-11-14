import React from 'react';
import {Composition} from 'remotion';
import type {FilmDef} from './engine/types';
import {Film, Sheet, filmFrames, sheetSize} from './engine/Film';
import {NokiaBaseline} from './baseline/NokiaBaseline';
import {CatsBaseline} from './baseline/CatsBaseline';
import {CrisisBaseline} from './baseline/CrisisBaseline';
import {Preview as HormoziPreview, PreviewSheet as HormoziSheet, PREVIEW_FRAMES as HORMOZI_FRAMES, SHEET_SIZE as HORMOZI_SHEET} from './styles/hormozi-kinetic/Preview';
import {Preview as DnPreview, PreviewSheet as DnSheet, PREVIEW_FRAMES as DN_FRAMES, SHEET_SIZE as DN_SHEET} from './styles/dark-neon-dataviz/Preview';
import {Preview as TvPreview, PreviewSheet as TvSheet, PREVIEW_FRAMES as TV_FRAMES, SHEET_SIZE as TV_SHEET} from './styles/tactical-vector-maps/Preview';
import {Preview as ArcPreview, PreviewSheet as ArcSheet, PREVIEW_FRAMES as ARC_FRAMES, SHEET_SIZE as ARC_SHEET} from './styles/archival-grunge/Preview';
import {Preview as HudPreview, PreviewSheet as HudSheet, PREVIEW_FRAMES as HUD_FRAMES, SHEET_SIZE as HUD_SHEET} from './styles/scifi-hud/Preview';
import {Preview as PdPreview, PreviewSheet as PdSheet, PREVIEW_FRAMES as PD_FRAMES, SHEET_SIZE as PD_SHEET} from './styles/2-5d-parallax-depth/Preview';
import {Preview as IsoPreview, PreviewSheet as IsoSheet, PREVIEW_FRAMES as ISO_FRAMES, SHEET_SIZE as ISO_SHEET} from './styles/low-poly-isometric/Preview';
import {Preview as HoloPreview, PreviewSheet as HoloSheet, PREVIEW_FRAMES as HOLO_FRAMES, SHEET_SIZE as HOLO_SHEET} from './styles/holographic-wireframe/Preview';
import {Preview as PlexPreview, PreviewSheet as PlexSheet, PREVIEW_FRAMES as PLEX_FRAMES, SHEET_SIZE as PLEX_SHEET} from './styles/glowing-plexus/Preview';
import {Preview as VoxPreview, PreviewSheet as VoxSheet, PREVIEW_FRAMES as VOX_FRAMES, SHEET_SIZE as VOX_SHEET} from './styles/voxel-art/Preview';
import {Preview as DoodlePreview, PreviewSheet as DoodleSheet, PREVIEW_FRAMES as DOODLE_FRAMES, SHEET_SIZE as DOODLE_SHEET} from './styles/minimalist-doodle/Preview';
import {Preview as NeoPreview, PreviewSheet as NeoSheet, PREVIEW_FRAMES as NEO_FRAMES, SHEET_SIZE as NEO_SHEET} from './styles/neo-brutalist-ui/Preview';
import {SocialSheet, SocialReel, SOCIAL_SHEET_SIZE, SOCIAL_REEL_FRAMES} from './widgets/social/Sheet';

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
		<Composition id="Preview-neo-brutalist-ui" component={NeoPreview} durationInFrames={NEO_FRAMES} fps={30} width={1080} height={1920} defaultProps={{palette: 'butter-ink', pairing: 'bricolage-dmsans'}} />
		<Composition id="PreviewSheet-neo-brutalist-ui" component={NeoSheet} durationInFrames={NEO_FRAMES} fps={30} width={NEO_SHEET.width} height={NEO_SHEET.height} defaultProps={{palette: 'butter-ink', pairing: 'bricolage-dmsans'}} />
		<Composition id="Preview-dark-neon-dataviz" component={DnPreview} durationInFrames={DN_FRAMES} fps={30} width={1080} height={1920} defaultProps={{palette: 'obsidian-cyan', pairing: 'grotesk-inter-jb'}} />
		<Composition id="PreviewSheet-dark-neon-dataviz" component={DnSheet} durationInFrames={DN_FRAMES} fps={30} width={DN_SHEET.width} height={DN_SHEET.height} defaultProps={{palette: 'obsidian-cyan', pairing: 'grotesk-inter-jb'}} />
		<Composition id="Preview-tactical-vector-maps" component={TvPreview} durationInFrames={TV_FRAMES} fps={30} width={1080} height={1920} defaultProps={{palette: 'night-atlas', pairing: 'oswald-inter-playfair'}} />
		<Composition id="PreviewSheet-tactical-vector-maps" component={TvSheet} durationInFrames={TV_FRAMES} fps={30} width={TV_SHEET.width} height={TV_SHEET.height} defaultProps={{palette: 'night-atlas', pairing: 'oswald-inter-playfair'}} />
		<Composition id="Preview-2-5d-parallax-depth" component={PdPreview} durationInFrames={PD_FRAMES} fps={30} width={1080} height={1920} defaultProps={{palette: 'dusk-harbour', pairing: 'anton-dmsans-dmserif'}} />
		<Composition id="PreviewSheet-2-5d-parallax-depth" component={PdSheet} durationInFrames={PD_FRAMES} fps={30} width={PD_SHEET.width} height={PD_SHEET.height} defaultProps={{palette: 'dusk-harbour', pairing: 'anton-dmsans-dmserif'}} />
		<Composition id="Preview-scifi-hud" component={HudPreview} durationInFrames={HUD_FRAMES} fps={30} width={1080} height={1920} defaultProps={{palette: 'cyan-ops', pairing: 'orbitron-chakra-sharetech'}} />
		<Composition id="PreviewSheet-scifi-hud" component={HudSheet} durationInFrames={HUD_FRAMES} fps={30} width={HUD_SHEET.width} height={HUD_SHEET.height} defaultProps={{palette: 'cyan-ops', pairing: 'orbitron-chakra-sharetech'}} />
		<Composition id="Preview-archival-grunge" component={ArcPreview} durationInFrames={ARC_FRAMES} fps={30} width={1080} height={1920} defaultProps={{palette: 'newsprint', pairing: 'playfair-specialelite-reenie'}} />
		<Composition id="PreviewSheet-archival-grunge" component={ArcSheet} durationInFrames={ARC_FRAMES} fps={30} width={ARC_SHEET.width} height={ARC_SHEET.height} defaultProps={{palette: 'newsprint', pairing: 'playfair-specialelite-reenie'}} />
		<Composition id="Preview-low-poly-isometric" component={IsoPreview} durationInFrames={ISO_FRAMES} fps={30} width={1080} height={1920} defaultProps={{palette: 'harbour-town', pairing: 'fredoka-nunito-dmmono'}} />
		<Composition id="PreviewSheet-low-poly-isometric" component={IsoSheet} durationInFrames={ISO_FRAMES} fps={30} width={ISO_SHEET.width} height={ISO_SHEET.height} defaultProps={{palette: 'harbour-town', pairing: 'fredoka-nunito-dmmono'}} />
		<Composition id="Preview-holographic-wireframe" component={HoloPreview} durationInFrames={HOLO_FRAMES} fps={30} width={1080} height={1920} defaultProps={{palette: 'deep-lab', pairing: 'unbounded-plexsans-plexmono'}} />
		<Composition id="PreviewSheet-holographic-wireframe" component={HoloSheet} durationInFrames={HOLO_FRAMES} fps={30} width={HOLO_SHEET.width} height={HOLO_SHEET.height} defaultProps={{palette: 'deep-lab', pairing: 'unbounded-plexsans-plexmono'}} />
		<Composition id="Preview-glowing-plexus" component={PlexPreview} durationInFrames={PLEX_FRAMES} fps={30} width={1080} height={1920} defaultProps={{palette: 'deep-mind', pairing: 'sora-manrope-dmmono'}} />
		<Composition id="PreviewSheet-glowing-plexus" component={PlexSheet} durationInFrames={PLEX_FRAMES} fps={30} width={PLEX_SHEET.width} height={PLEX_SHEET.height} defaultProps={{palette: 'deep-mind', pairing: 'sora-manrope-dmmono'}} />
		<Composition id="Preview-voxel-art" component={VoxPreview} durationInFrames={VOX_FRAMES} fps={30} width={1080} height={1920} defaultProps={{palette: 'sunny-isle', pairing: 'lilita-nunito-spacemono'}} />
		<Composition id="PreviewSheet-voxel-art" component={VoxSheet} durationInFrames={VOX_FRAMES} fps={30} width={VOX_SHEET.width} height={VOX_SHEET.height} defaultProps={{palette: 'sunny-isle', pairing: 'lilita-nunito-spacemono'}} />
		<Composition id="Preview-minimalist-doodle" component={DoodlePreview} durationInFrames={DOODLE_FRAMES} fps={30} width={1080} height={1920} defaultProps={{palette: 'kraft-red', pairing: 'kalam-nunito-courierprime'}} />
		<Composition id="PreviewSheet-minimalist-doodle" component={DoodleSheet} durationInFrames={DOODLE_FRAMES} fps={30} width={DOODLE_SHEET.width} height={DOODLE_SHEET.height} defaultProps={{palette: 'kraft-red', pairing: 'kalam-nunito-courierprime'}} />
		<Composition id="Baseline-nokia"component={NokiaBaseline} durationInFrames={1350} fps={30} width={1080} height={1920} />
		<Composition id="Baseline-cats" component={CatsBaseline} durationInFrames={900} fps={30} width={1080} height={1920} />
		<Composition id="Baseline-crisis" component={CrisisBaseline} durationInFrames={1800} fps={30} width={1920} height={1080} />
		<Composition id="SocialSheet" component={SocialSheet} durationInFrames={1} fps={30} width={SOCIAL_SHEET_SIZE.width} height={SOCIAL_SHEET_SIZE.height} defaultProps={{style: 'neo-brutalist-ui', palette: 'butter-ink', pairing: 'bricolage-dmsans'}} />
		<Composition id="SocialReel" component={SocialReel} durationInFrames={SOCIAL_REEL_FRAMES} fps={30} width={1080} height={1920} defaultProps={{style: 'neo-brutalist-ui', palette: 'butter-ink', pairing: 'bricolage-dmsans'}} />
	</>
);
