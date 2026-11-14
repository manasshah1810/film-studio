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
import * as S from './index';
import type {Pairing} from '../../engine/types';

/** Contact sheet and reel for the 10 social widgets, in any built style. Content is fictional. */
const SYSTEMS = [parallax, grunge, neon, plexus, holo, hormozi, iso, doodle, brutal, hud, maps, voxel] as unknown as S.DesignJson[];
export type SheetProps = {style?: string; palette?: string; pairing?: string};

/** Widget boxes in percent of the frame. Mirrored 1:1 by the storyboard check-design and check-safezones read. */
export const SOCIAL_BOXES: Record<string, S.Box> = {
	kicker: {x: 8, y: 8, w: 76, h: 3},
	LiveCursor: {x: 8, y: 30, w: 76, h: 40},
	CommentDrop: {x: 8, y: 24, w: 76, h: 50},
	VoiceNote: {x: 8, y: 40, w: 76, h: 12},
	PostWall: {x: 8, y: 20, w: 76, h: 52},
	ReelFeed: {x: 16, y: 14, w: 60, h: 62},
	ReelCascade: {x: 8, y: 16, w: 76, h: 60},
	VideoCard: {x: 8, y: 26, w: 76, h: 38},
	CommentCTA: {x: 8, y: 34, w: 76, h: 22},
	PromptBar: {x: 8, y: 30, w: 76, h: 24},
	JiggleDelete: {x: 8, y: 28, w: 76, h: 38},
};

type Entry = {id: string; frames: number; hero: number; render: (tk: S.SocialTokens, frame: number) => React.ReactNode};
const B = SOCIAL_BOXES;
export const SOCIAL: Entry[] = [
	{id: 'LiveCursor', ...S.LIVE_CURSOR, render: (tk, f) => <S.LiveCursor tk={tk} frame={f} box={B.LiveCursor} name="Mira Okafor" handle="@mira.makes" label="Follow" labelAfter="Following" />},
	{
		id: 'CommentDrop',
		...S.COMMENT_DROP,
		render: (tk, f) => (
			<S.CommentDrop
				tk={tk}
				frame={f}
				box={B.CommentDrop}
				author="@studio.notes"
				caption="We cut the intro to 1 second. Watch time went up."
				comments={[
					{user: 'dev.ray', text: 'Show the before and after please', likes: 312},
					{user: 'lena_k', text: 'Wait, only 1 second??', likes: 1204},
					{user: 'tomas.b', text: 'Trying this on my next post', likes: 88},
				]}
			/>
		),
	},
	{id: 'VoiceNote', ...S.VOICE_NOTE, render: (tk, f) => <S.VoiceNote tk={tk} frame={f} box={B.VoiceNote} seconds={7} seed="voice-23" />},
	{id: 'PostWall', ...S.POST_WALL, render: (tk, f) => <S.PostWall tk={tk} frame={f} box={B.PostWall} handle="@mira.makes" stats="48 posts · 12.4K followers" posts={['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7', 'Day 8', 'Day 9']} hero={4} />},
	{
		id: 'ReelFeed',
		...S.REEL_FEED,
		render: (tk, f) => (
			<S.ReelFeed
				tk={tk}
				frame={f}
				box={B.ReelFeed}
				reels={[
					{title: 'Hook in 1 second', handle: '@studio.notes', likes: 48200, comments: 913},
					{title: 'Cut every pause', handle: '@mira.makes', likes: 1240000, comments: 8800},
					{title: 'End on a question', handle: '@dev.ray', likes: 9100, comments: 240},
				]}
			/>
		),
	},
	{id: 'ReelCascade', ...S.REEL_CASCADE, render: (tk, f) => <S.ReelCascade tk={tk} frame={f} box={B.ReelCascade} seed="cascade-23" views={[84000, 1200000, 3100, 410000, 27000, 960, 52000]} />},
	{id: 'VideoCard', ...S.VIDEO_CARD, render: (tk, f) => <S.VideoCard tk={tk} frame={f} box={B.VideoCard} title="I tried a 5 a.m. routine for 30 days" channel="Mira Okafor" views={214000} duration="12:48" age="3 days ago" thumb="5 A.M. CLUB" />},
	{id: 'CommentCTA', ...S.COMMENT_CTA, render: (tk, f) => <S.CommentCTA tk={tk} frame={f} box={B.CommentCTA} ask="Want the checklist? Comment" keyword="ROUTINE" user="you" />},
	{id: 'PromptBar', ...S.PROMPT_BAR, render: (tk, f) => <S.PromptBar tk={tk} frame={f} box={B.PromptBar} prompt="Write a 3 line hook about sleep" answer="Most people fix their mornings. The trick is the night before. Here is the 10 minute reset." />},
	{id: 'JiggleDelete', ...S.JIGGLE_DELETE, render: (tk, f) => <S.JiggleDelete tk={tk} frame={f} box={B.JiggleDelete} apps={['Notes', 'Photos', 'Clock', 'Scroll', 'Music', 'Maps', 'Mail', 'Camera', 'Wallet', 'Weather', 'Books', 'Health']} target={3} />},
];

const resolve = ({style = 'neo-brutalist-ui', palette, pairing}: SheetProps) => {
	const ds = SYSTEMS.find((d) => d.style === style) ?? SYSTEMS[0];
	const tk = S.socialTokens(ds, palette, pairing);
	const fonts = (ds.fonts.find((p) => p.id === pairing) ?? ds.fonts[0]) as Pairing;
	return {tk, fonts};
};

const Cell: React.FC<{tk: S.SocialTokens; n: number; e: Entry; frame: number}> = ({tk, n, e, frame}) => (
	<AbsoluteFill style={{background: tk.c.bg, overflow: 'hidden'}}>
		<div style={{...S.boxStyle(B.kicker), display: 'flex', alignItems: 'center', gap: 20}}>
			<span style={S.txt(tk, 'mono', tk.size.label, tk.c.ink)}>{`${String(n).padStart(2, '0')}  ${e.id}`}</span>
		</div>
		{e.render(tk, frame)}
	</AbsoluteFill>
);

export const SHEET_COLS = 5;
export const SOCIAL_SHEET_SIZE = {width: 1080 * SHEET_COLS, height: 1920 * Math.ceil(SOCIAL.length / SHEET_COLS)};
export const SOCIAL_REEL_FRAMES = SOCIAL.reduce((s, e) => s + e.frames, 0);

/** Every widget frozen on its hero frame, 5 x 2. Override frames with `at` (one local frame for all). */
export const SocialSheet: React.FC<SheetProps & {at?: number}> = (p) => {
	const {tk, fonts} = resolve(p);
	return (
		<FontGate fonts={fonts}>
			<AbsoluteFill style={{background: tk.c.ink}}>
				{SOCIAL.map((e, i) => (
					<div key={e.id} style={{position: 'absolute', left: (i % SHEET_COLS) * 1080, top: Math.floor(i / SHEET_COLS) * 1920, width: 1080, height: 1920, overflow: 'hidden'}}>
						<Freeze frame={p.at ?? e.hero}>
							<Cell tk={tk} n={i + 1} e={e} frame={p.at ?? e.hero} />
						</Freeze>
					</div>
				))}
			</AbsoluteFill>
		</FontGate>
	);
};

const Live: React.FC<{tk: S.SocialTokens; n: number; e: Entry}> = ({tk, n, e}) => <Cell tk={tk} n={n} e={e} frame={useCurrentFrame()} />;

/** All 10 widgets back to back, each in its own Sequence (local frame from 0). */
export const SocialReel: React.FC<SheetProps> = (p) => {
	const {tk, fonts} = resolve(p);
	let from = 0;
	return (
		<FontGate fonts={fonts}>
			<AbsoluteFill style={{background: tk.c.bg}}>
				{SOCIAL.map((e, i) => {
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
