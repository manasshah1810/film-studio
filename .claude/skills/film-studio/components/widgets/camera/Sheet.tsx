import React from 'react';
import {AbsoluteFill, Freeze, Sequence, useCurrentFrame} from 'remotion';
import {FontGate} from '../../engine/fonts';
import parallax from '../../../styles/2-5d-parallax-depth/design-system.json';
import grunge from '../../../styles/archival-grunge/design-system.json';
import neon from '../../../styles/dark-neon-dataviz/design-system.json';
import plexus from '../../../styles/glowing-plexus/design-system.json';
import holo from '../../../styles/holographic-wireframe/design-system.json';
import hormozi from '../../../styles/hormozi-kinetic/design-system.json';
import iso from '../../../styles/low-poly-isometric/design-system.json';
import doodle from '../../../styles/minimalist-doodle/design-system.json';
import brutal from '../../../styles/neo-brutalist-ui/design-system.json';
import hud from '../../../styles/scifi-hud/design-system.json';
import maps from '../../../styles/tactical-vector-maps/design-system.json';
import voxel from '../../../styles/voxel-art/design-system.json';
import {txt, type Box} from '../social/tokens';
import * as K from './index';
import type {Pairing} from '../../engine/types';

/** Contact sheet and reel for the 10 camera widgets, in any built style. Every name, file and value here is sample content. */
const SYSTEMS = [parallax, grunge, neon, plexus, holo, hormozi, iso, doodle, brutal, hud, maps, voxel] as unknown as K.CameraJson[];
export type SheetProps = {style?: string; palette?: string; pairing?: string};

/** Widget boxes in percent of the frame. Mirrored 1:1 by the storyboard that check-design and check-safezones read. */
export const CAMERA_BOXES: Record<string, Box> = {
	kicker: {x: 8, y: 8, w: 76, h: 3},
	RackFocus: {x: 8, y: 16, w: 76, h: 60},
	ImpactFrame: {x: 8, y: 16, w: 76, h: 60},
	DollyZoom: {x: 8, y: 16, w: 76, h: 60},
	BladeSlice: {x: 8, y: 16, w: 76, h: 60},
	FilmLook: {x: 8, y: 16, w: 76, h: 60},
	LensRing: {x: 8, y: 16, w: 76, h: 60},
	GradeSlider: {x: 8, y: 16, w: 76, h: 60},
	EyedropperGrade: {x: 8, y: 16, w: 76, h: 60},
	FileDrop: {x: 8, y: 18, w: 76, h: 52},
	IconStrike: {x: 8, y: 20, w: 76, h: 48},
};

type Entry = {id: string; frames: number; hero: number; render: (tk: K.CameraTokens, frame: number) => React.ReactNode};
const B = CAMERA_BOXES;
export const CAMERA: Entry[] = [
	{id: 'RackFocus', ...K.RACK_FOCUS, render: (tk, f) => <K.RackFocus tk={tk} frame={f} box={B.RackFocus} label="SAMPLE SHOT · FOCUS PULL" near="The courier at the gate" far="A light in the tower" seed="rack-26" />},
	{id: 'ImpactFrame', ...K.IMPACT_FRAME, render: (tk, f) => <K.ImpactFrame tk={tk} frame={f} box={B.ImpactFrame} label="SAMPLE SHOT · PAYOFF" word="GONE." seed="impact-26" />},
	{id: 'DollyZoom', ...K.DOLLY_ZOOM, render: (tk, f) => <K.DollyZoom tk={tk} frame={f} box={B.DollyZoom} label="SAMPLE SHOT · REALISATION" seed="dolly-26" />},
	{id: 'BladeSlice', ...K.BLADE_SLICE, render: (tk, f) => <K.BladeSlice tk={tk} frame={f} box={B.BladeSlice} label="SAMPLE CUT" from="Harbour, 6 p.m." to="Harbour, midnight" seed="blade-26" />},
	{id: 'FilmLook', ...K.FILM_LOOK, render: (tk, f) => <K.FilmLook tk={tk} frame={f} box={B.FilmLook} label="SAMPLE · PRINT LOOK" seed="film-26" />},
	{id: 'LensRing', ...K.LENS_RING, render: (tk, f) => <K.LensRing tk={tk} frame={f} box={B.LensRing} label="SAMPLE SHOT · DETAIL" caption="Someone is still up there. (Sample.)" seed="lens-26" />},
	{id: 'GradeSlider', ...K.GRADE_SLIDER, render: (tk, f) => <K.GradeSlider tk={tk} frame={f} box={B.GradeSlider} label="SAMPLE GRADE" seed="grade-26" />},
	{id: 'EyedropperGrade', ...K.EYEDROPPER_GRADE, render: (tk, f) => <K.EyedropperGrade tk={tk} frame={f} box={B.EyedropperGrade} label="SAMPLE · PALETTE PULL" seed="drop-26" />},
	{id: 'FileDrop', ...K.FILE_DROP, render: (tk, f) => <K.FileDrop tk={tk} frame={f} box={B.FileDrop} label="SAMPLE INGEST" file="harbour_take_04.mov" ext="mov" sizeMB={642} seed="file-26" />},
	{id: 'IconStrike', ...K.ICON_STRIKE, render: (tk, f) => <K.IconStrike tk={tk} frame={f} box={B.IconStrike} icon="camera" label="RULE 01 · SAMPLE" name="Stock footage" verdict="Every frame here is drawn in code." seed="strike-26" />},
];

const resolve = ({style = '2-5d-parallax-depth', palette, pairing}: SheetProps) => {
	const ds = SYSTEMS.find((d) => d.style === style) ?? SYSTEMS[0];
	const tk = K.cameraTokens(ds, palette, pairing);
	const fonts = (ds.fonts.find((p) => p.id === pairing) ?? ds.fonts[0]) as Pairing;
	return {tk, fonts};
};

const Cell: React.FC<{tk: K.CameraTokens; n: number; e: Entry; frame: number}> = ({tk, n, e, frame}) => (
	<AbsoluteFill style={{background: tk.c.bg, overflow: 'hidden'}}>
		<div style={{position: 'absolute', left: 0.08 * 1080, top: 0.08 * 1920, width: 0.76 * 1080, height: 0.03 * 1920, display: 'flex', alignItems: 'center'}}>
			<span style={txt(tk, 'mono', tk.size.label, tk.on('bg').hex)}>{`${String(n + 30).padStart(2, '0')}  ${e.id}`}</span>
		</div>
		{e.render(tk, frame)}
	</AbsoluteFill>
);

export const CAM_SHEET_COLS = 5;
export const CAMERA_SHEET_SIZE = {width: 1080 * CAM_SHEET_COLS, height: 1920 * Math.ceil(CAMERA.length / CAM_SHEET_COLS)};
export const CAMERA_REEL_FRAMES = CAMERA.reduce((s, e) => s + e.frames, 0);

/** Every widget frozen on its hero frame, 5 x 2. `at` overrides the frame for all cells. */
export const CameraSheet: React.FC<SheetProps & {at?: number}> = (p) => {
	const {tk, fonts} = resolve(p);
	return (
		<FontGate fonts={fonts}>
			<AbsoluteFill style={{background: tk.c.ink}}>
				{CAMERA.map((e, i) => (
					<div key={e.id} style={{position: 'absolute', left: (i % CAM_SHEET_COLS) * 1080, top: Math.floor(i / CAM_SHEET_COLS) * 1920, width: 1080, height: 1920, overflow: 'hidden'}}>
						<Freeze frame={p.at ?? e.hero}>
							<Cell tk={tk} n={i + 1} e={e} frame={p.at ?? e.hero} />
						</Freeze>
					</div>
				))}
			</AbsoluteFill>
		</FontGate>
	);
};

const Live: React.FC<{tk: K.CameraTokens; n: number; e: Entry}> = ({tk, n, e}) => <Cell tk={tk} n={n} e={e} frame={useCurrentFrame()} />;

/** All 10 widgets back to back, each in its own Sequence (local frame from 0). */
export const CameraReel: React.FC<SheetProps> = (p) => {
	const {tk, fonts} = resolve(p);
	let from = 0;
	return (
		<FontGate fonts={fonts}>
			<AbsoluteFill style={{background: tk.c.bg}}>
				{CAMERA.map((e, i) => {
					const s = from;
					from += e.frames;
					return (
						<Sequence key={e.id} from={s} durationInFrames={e.frames}>
							<Live tk={tk} n={i + 1} e={e} />
						</Sequence>
					);
				})}
			</AbsoluteFill>
		</FontGate>
	);
};
