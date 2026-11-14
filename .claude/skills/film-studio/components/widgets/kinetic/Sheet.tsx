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

/** Contact sheet and reel for the 10 kinetic widgets, in any built style. Every name, line and value here is sample content. */
const SYSTEMS = [parallax, grunge, neon, plexus, holo, hormozi, iso, doodle, brutal, hud, maps, voxel] as unknown as K.KinJson[];
export type SheetProps = {style?: string; palette?: string; pairing?: string};

/** Widget boxes in percent of the frame. Mirrored 1:1 by the storyboard that check-design and check-safezones read. */
export const KINETIC_BOXES: Record<string, Box> = {
	kicker: {x: 8, y: 8, w: 76, h: 3},
	HeadStack: {x: 8, y: 16, w: 76, h: 60},
	LetterDive: {x: 8, y: 16, w: 76, h: 60},
	PictureDive: {x: 8, y: 16, w: 76, h: 60},
	LayerExplode: {x: 8, y: 16, w: 76, h: 60},
	BlowAway: {x: 8, y: 16, w: 76, h: 60},
	KnockoutCaptions: {x: 8, y: 16, w: 76, h: 60},
	KineticHook: {x: 8, y: 16, w: 76, h: 60},
	GravityDrop: {x: 8, y: 16, w: 76, h: 60},
	GiantCaptions: {x: 8, y: 16, w: 76, h: 60},
	StoryboardDeck: {x: 8, y: 16, w: 76, h: 60},
};

type Entry = {id: string; frames: number; hero: number; render: (tk: K.KineticTokens, frame: number) => React.ReactNode};
const B = KINETIC_BOXES;
export const KINETIC: Entry[] = [
	{id: 'HeadStack', ...K.HEAD_STACK, render: (tk, f) => <K.HeadStack tk={tk} frame={f} box={B.HeadStack} label="SAMPLE POLL" heads={['Ana', 'Raj', 'Mei', 'Tom', 'Zoe']} speaker={2} quote="I quit three weeks before it worked." tally="4 of 5 agreed. (Sample.)" seed="heads-27" />},
	{id: 'LetterDive', ...K.LETTER_DIVE, render: (tk, f) => <K.LetterDive tk={tk} frame={f} box={B.LetterDive} label="SAMPLE · LETTER DIVE" word="INSIDE" to="THE PLAN" seed="dive-27" />},
	{id: 'PictureDive', ...K.PICTURE_DIVE, render: (tk, f) => <K.PictureDive tk={tk} frame={f} box={B.PictureDive} label="SAMPLE · PICTURE DIVE" outside="A painting in the hall" inside="Harbour, 1962 (sample)" seed="pic-27" />},
	{id: 'LayerExplode', ...K.LAYER_EXPLODE, render: (tk, f) => <K.LayerExplode tk={tk} frame={f} box={B.LayerExplode} label="SAMPLE · THE STACK" seed="layers-27" />},
	{id: 'BlowAway', ...K.BLOW_AWAY, render: (tk, f) => <K.BlowAway tk={tk} frame={f} box={B.BlowAway} label="SAMPLE · OLD IDEA OUT" from="Work harder than everyone else" to="Work on the *right* thing" seed="blow-27" />},
	{id: 'KnockoutCaptions', ...K.KNOCKOUT_CAPTIONS, render: (tk, f) => <K.KnockoutCaptions tk={tk} frame={f} box={B.KnockoutCaptions} label="SAMPLE CAPTION" text="Most people quit *three* weeks before it starts *working.*" seed="knock-27" />},
	{id: 'KineticHook', ...K.KINETIC_HOOK, render: (tk, f) => <K.KineticHook tk={tk} frame={f} box={B.KineticHook} label="SAMPLE HOOK" kicker="Wait." text="You lose {n} a month to *this*" count={{to: 400, prefix: '$'}} seed="hook-27" />},
	{id: 'GravityDrop', ...K.GRAVITY_DROP, render: (tk, f) => <K.GravityDrop tk={tk} frame={f} box={B.GravityDrop} label="SAMPLE · DROP" text="Small habits *stack* into big results" seed="drop-27" />},
	{id: 'GiantCaptions', ...K.GIANT_CAPTIONS, render: (tk, f) => <K.GiantCaptions tk={tk} frame={f} box={B.GiantCaptions} label="SAMPLE PAYOFF" text="This *one* habit *doubled* my output." seed="giant-27" />},
	{id: 'StoryboardDeck', ...K.STORYBOARD_DECK, render: (tk, f) => <K.StoryboardDeck tk={tk} frame={f} box={B.StoryboardDeck} label="SAMPLE BOARD" scenes={['The harbour at dusk', 'The courier waits', 'Night falls', 'A light in the tower', 'The long walk', 'The courier turns']} seed="deck-27" />},
];

const resolve = ({style = 'hormozi-kinetic', palette, pairing}: SheetProps) => {
	const ds = SYSTEMS.find((d) => d.style === style) ?? SYSTEMS[0];
	const tk = K.kineticTokens(ds, palette, pairing);
	const fonts = (ds.fonts.find((p) => p.id === pairing) ?? ds.fonts[0]) as Pairing;
	return {tk, fonts};
};

const Cell: React.FC<{tk: K.KineticTokens; n: number; e: Entry; frame: number}> = ({tk, n, e, frame}) => (
	<AbsoluteFill style={{background: tk.c.bg, overflow: 'hidden'}}>
		<div style={{position: 'absolute', left: 0.08 * 1080, top: 0.08 * 1920, width: 0.76 * 1080, height: 0.03 * 1920, display: 'flex', alignItems: 'center'}}>
			<span style={txt(tk, 'mono', tk.size.label, tk.on('bg').hex)}>{`${String(n + 40).padStart(2, '0')}  ${e.id}`}</span>
		</div>
		{e.render(tk, frame)}
	</AbsoluteFill>
);

export const KIN_SHEET_COLS = 5;
export const KINETIC_SHEET_SIZE = {width: 1080 * KIN_SHEET_COLS, height: 1920 * Math.ceil(KINETIC.length / KIN_SHEET_COLS)};
export const KINETIC_REEL_FRAMES = KINETIC.reduce((s, e) => s + e.frames, 0);

/** Every widget frozen on its hero frame, 5 x 2. `at` overrides the frame for all cells. */
export const KineticSheet: React.FC<SheetProps & {at?: number}> = (p) => {
	const {tk, fonts} = resolve(p);
	return (
		<FontGate fonts={fonts}>
			<AbsoluteFill style={{background: tk.c.ink}}>
				{KINETIC.map((e, i) => (
					<div key={e.id} style={{position: 'absolute', left: (i % KIN_SHEET_COLS) * 1080, top: Math.floor(i / KIN_SHEET_COLS) * 1920, width: 1080, height: 1920, overflow: 'hidden'}}>
						<Freeze frame={p.at ?? e.hero}>
							<Cell tk={tk} n={i + 1} e={e} frame={p.at ?? e.hero} />
						</Freeze>
					</div>
				))}
			</AbsoluteFill>
		</FontGate>
	);
};

const Live: React.FC<{tk: K.KineticTokens; n: number; e: Entry}> = ({tk, n, e}) => <Cell tk={tk} n={n} e={e} frame={useCurrentFrame()} />;

/** All 10 widgets back to back, each in its own Sequence (local frame from 0). */
export const KineticReel: React.FC<SheetProps> = (p) => {
	const {tk, fonts} = resolve(p);
	let from = 0;
	return (
		<FontGate fonts={fonts}>
			<AbsoluteFill style={{background: tk.c.bg}}>
				{KINETIC.map((e, i) => {
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
