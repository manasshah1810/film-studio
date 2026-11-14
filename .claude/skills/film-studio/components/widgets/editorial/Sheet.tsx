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
import * as E from './index';
import type {Pairing} from '../../engine/types';

/** Contact sheet and reel for the 10 editorial widgets, in any built style. All names, papers and files are made up. */
const SYSTEMS = [parallax, grunge, neon, plexus, holo, hormozi, iso, doodle, brutal, hud, maps, voxel] as unknown as E.EditorialJson[];
export type SheetProps = {style?: string; palette?: string; pairing?: string};

/** Widget boxes in percent of the frame. Mirrored 1:1 by the storyboard that check-design and check-safezones read. */
export const EDITORIAL_BOXES: Record<string, Box> = {
	kicker: {x: 8, y: 8, w: 76, h: 3},
	MagazineCover: {x: 12, y: 20, w: 68, h: 50},
	PressFront: {x: 8, y: 14, w: 76, h: 62},
	PaperTear: {x: 10, y: 22, w: 72, h: 50},
	ScreenplayPage: {x: 10, y: 18, w: 72, h: 46},
	SerifStamp: {x: 8, y: 24, w: 76, h: 46},
	LiveMarkup: {x: 8, y: 26, w: 76, h: 34},
	SketchWords: {x: 8, y: 30, w: 76, h: 34},
	GreasePencilSheet: {x: 8, y: 22, w: 76, h: 50},
	ContactSheetHook: {x: 8, y: 16, w: 76, h: 55},
	TitleCard: {x: 8, y: 32, w: 76, h: 30},
};

type Entry = {id: string; frames: number; hero: number; render: (tk: E.EditorialTokens, frame: number) => React.ReactNode};
const B = EDITORIAL_BOXES;
export const EDITORIAL: Entry[] = [
	{id: 'MagazineCover', ...E.MAGAZINE_COVER, render: (tk, f) => <E.MagazineCover tk={tk} frame={f} box={B.MagazineCover} masthead="VANTAGE" issue="NO. 14 · SPRING 1987" headline="The quiet founder who said no" lines={['Inside the 9-year bet', 'What the board missed', 'Plus: the lost tapes']} flash="EXCLUSIVE" seed="mag-24" />},
	{id: 'PressFront', ...E.PRESS_FRONT, render: (tk, f) => <E.PressFront tk={tk} frame={f} box={B.PressFront} paper="The Morning Ledger" date="TUESDAY, MARCH 3, 1987" edition="LATE CITY EDITION" headline="Mill closes after 90 years, 2,000 jobs lost" mark="2,000 jobs lost" deck="Workers learned the news from a notice on the gate at 6 a.m." caption="Crowds at the gate on Monday." seed="press-24" />},
	{id: 'PaperTear', ...E.PAPER_TEAR, render: (tk, f) => <E.PaperTear tk={tk} frame={f} box={B.PaperTear} before={{kicker: 'OFFICIAL STATEMENT', title: 'Everything is under control.'}} after={{kicker: 'INTERNAL MEMO · MAY 2', title: 'We have six weeks of cash left.', body: 'Do not share this outside the board. Talks with the bank ended on Friday.'}} seed="tear-24" />},
	{id: 'ScreenplayPage', ...E.SCREENPLAY_PAGE, render: (tk, f) => <E.ScreenplayPage tk={tk} frame={f} box={B.ScreenplayPage} page={42} heading="INT. GARAGE - NIGHT" action="Rain on the tin roof. ELENA (30s) stares at a cracked laptop screen." character="Elena" paren="quietly" dialogue="If this works, nobody will ever know it was us." seed="script-24" />},
	{id: 'SerifStamp', ...E.SERIF_STAMP, render: (tk, f) => <E.SerifStamp tk={tk} frame={f} box={B.SerifStamp} word="Classified" sub="File 0417 · 1962" title="Project Lantern" meta="DEPT. 9 · PAGE 2 OF 9 · COPY 3" sign="R. Hale" seed="stamp-24" />},
	{
		id: 'LiveMarkup',
		...E.LIVE_MARKUP,
		render: (tk, f) => (
			<E.LiveMarkup
				tk={tk}
				frame={f}
				box={B.LiveMarkup}
				lines={['The company said the fire was', 'an accident. Records show the', 'alarm was switched off two', 'days before. No one was charged.']}
				marks={[{text: 'accident', kind: 'circle'}, {text: 'alarm was switched off', kind: 'marker'}, {text: 'No one was charged.', kind: 'underline'}]}
				note={{text: 'who knew?', mark: 2}}
				seed="markup-24"
			/>
		),
	},
	{id: 'SketchWords', ...E.SKETCH_WORDS, render: (tk, f) => <E.SketchWords tk={tk} frame={f} box={B.SketchWords} lines={['Nobody', 'read the', 'fine print.']} emphasis={2} seed="sketch-24" />},
	{id: 'GreasePencilSheet', ...E.GREASE_PENCIL_SHEET, render: (tk, f) => <E.GreasePencilSheet tk={tk} frame={f} box={B.GreasePencilSheet} crop={{x: 0.18, y: 0.2, w: 0.56, h: 0.6}} note="USE THIS" label="ROLL 7 · PRINT 12" seed="grease-24" />},
	{id: 'ContactSheetHook', ...E.CONTACT_SHEET_HOOK, render: (tk, f) => <E.ContactSheetHook tk={tk} frame={f} box={B.ContactSheetHook} roll="ROLL 14 · 12 EXP" target={7} caption="The one frame nobody printed." seed="contact-24" />},
	{id: 'TitleCard', ...E.TITLE_CARD, render: (tk, f) => <E.TitleCard tk={tk} frame={f} box={B.TitleCard} kicker="CHAPTER 03" title={['The Night', 'Shift']} sub="Detroit · Winter 1987" seed="title-24" />},
];

const resolve = ({style = 'archival-grunge', palette, pairing}: SheetProps) => {
	const ds = SYSTEMS.find((d) => d.style === style) ?? SYSTEMS[0];
	const tk = E.editorialTokens(ds, palette, pairing);
	const fonts = (ds.fonts.find((p) => p.id === pairing) ?? ds.fonts[0]) as Pairing;
	return {tk, fonts};
};

const Cell: React.FC<{tk: E.EditorialTokens; n: number; e: Entry; frame: number}> = ({tk, n, e, frame}) => (
	<AbsoluteFill style={{background: tk.c.bg, overflow: 'hidden'}}>
		<div style={{position: 'absolute', left: 0.08 * 1080, top: 0.08 * 1920, width: 0.76 * 1080, height: 0.03 * 1920, display: 'flex', alignItems: 'center'}}>
			<span style={txt(tk, 'mono', tk.size.label, tk.on('bg').hex)}>{`${String(n + 10).padStart(2, '0')}  ${e.id}`}</span>
		</div>
		{e.render(tk, frame)}
	</AbsoluteFill>
);

export const ED_SHEET_COLS = 5;
export const EDITORIAL_SHEET_SIZE = {width: 1080 * ED_SHEET_COLS, height: 1920 * Math.ceil(EDITORIAL.length / ED_SHEET_COLS)};
export const EDITORIAL_REEL_FRAMES = EDITORIAL.reduce((s, e) => s + e.frames, 0);

/** Every widget frozen on its hero frame, 5 x 2. `at` overrides the frame for all cells. */
export const EditorialSheet: React.FC<SheetProps & {at?: number}> = (p) => {
	const {tk, fonts} = resolve(p);
	return (
		<FontGate fonts={fonts}>
			<AbsoluteFill style={{background: tk.c.ink}}>
				{EDITORIAL.map((e, i) => (
					<div key={e.id} style={{position: 'absolute', left: (i % ED_SHEET_COLS) * 1080, top: Math.floor(i / ED_SHEET_COLS) * 1920, width: 1080, height: 1920, overflow: 'hidden'}}>
						<Freeze frame={p.at ?? e.hero}>
							<Cell tk={tk} n={i + 1} e={e} frame={p.at ?? e.hero} />
						</Freeze>
					</div>
				))}
			</AbsoluteFill>
		</FontGate>
	);
};

const Live: React.FC<{tk: E.EditorialTokens; n: number; e: Entry}> = ({tk, n, e}) => <Cell tk={tk} n={n} e={e} frame={useCurrentFrame()} />;

/** All 10 widgets back to back, each in its own Sequence (local frame from 0). */
export const EditorialReel: React.FC<SheetProps> = (p) => {
	const {tk, fonts} = resolve(p);
	let from = 0;
	return (
		<FontGate fonts={fonts}>
			<AbsoluteFill style={{background: tk.c.bg}}>
				{EDITORIAL.map((e, i) => {
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
