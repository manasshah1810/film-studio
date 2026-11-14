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
import * as D from './index';
import type {Pairing} from '../../engine/types';

/** Contact sheet and reel for the 10 data widgets, in any built style. Every number, name and file here is made up (sample data). */
const SYSTEMS = [parallax, grunge, neon, plexus, holo, hormozi, iso, doodle, brutal, hud, maps, voxel] as unknown as D.DataJson[];
export type SheetProps = {style?: string; palette?: string; pairing?: string};

/** Widget boxes in percent of the frame. Mirrored 1:1 by the storyboard that check-design and check-safezones read. */
export const DATA_BOXES: Record<string, Box> = {
	kicker: {x: 8, y: 8, w: 76, h: 3},
	CloneRow: {x: 8, y: 20, w: 76, h: 46},
	DayDial: {x: 8, y: 16, w: 76, h: 60},
	OrbitRing: {x: 8, y: 16, w: 76, h: 60},
	CodeBody: {x: 8, y: 22, w: 76, h: 34},
	Banknote: {x: 8, y: 22, w: 76, h: 44},
	RunningList: {x: 8, y: 18, w: 76, h: 46},
	PlayingGrid: {x: 8, y: 22, w: 76, h: 40},
	GridCollapse: {x: 8, y: 14, w: 76, h: 62},
	NLETimeline: {x: 8, y: 20, w: 76, h: 50},
	Keycaps: {x: 8, y: 28, w: 76, h: 30},
};

type Entry = {id: string; frames: number; hero: number; render: (tk: D.DataTokens, frame: number) => React.ReactNode};
const B = DATA_BOXES;
export const DATA: Entry[] = [
	{id: 'CloneRow', ...D.CLONE_ROW, render: (tk, f) => <D.CloneRow tk={tk} frame={f} box={B.CloneRow} count={10} hit={3} unit="circle" label="SAMPLE · 10 HOUSEHOLDS" caption="Three of every ten skip breakfast. (Sample data.)" seed="clone-25" />},
	{id: 'DayDial', ...D.DAY_DIAL, render: (tk, f) => <D.DayDial tk={tk} frame={f} box={B.DayDial} from={22.5} to={6.25} label="SLEEP WINDOW" caption="A night shift, on the clock" seed="dial-25" />},
	{id: 'OrbitRing', ...D.ORBIT_RING, render: (tk, f) => <D.OrbitRing tk={tk} frame={f} box={B.OrbitRing} value={72} label="GRID LOAD" caption="Sample reading, peak hour" seed="orbit-25" />},
	{
		id: 'CodeBody',
		...D.CODE_BODY,
		render: (tk, f) => (
			<D.CodeBody
				tk={tk}
				frame={f}
				box={B.CodeBody}
				file="ledger.ts"
				lines={['// close the month', 'const fees = rows.filter(isFee);', 'let total = 0;', 'for (const r of fees) {', '  total += r.amount * 1.07;', '}', 'return round(total, 2);']}
				focus={4}
				seed="code-25"
			/>
		),
	},
	{id: 'Banknote', ...D.BANKNOTE, render: (tk, f) => <D.Banknote tk={tk} frame={f} box={B.Banknote} from={100} to={62} symbol="$" label="WHAT 100 BUYS" years={['2000', '2025']} caption="Sample inflation path, not a real index." seed="note-25" />},
	{
		id: 'RunningList',
		...D.RUNNING_LIST,
		render: (tk, f) => (
			<D.RunningList
				tk={tk}
				frame={f}
				box={B.RunningList}
				title="TOP PORTS · SAMPLE TEU (M)"
				unit="M"
				dec={1}
				periods={['2005', '2025']}
				rows={[
					{label: 'Harbor North', values: [18.2, 21.0, 24.4, 26.1]},
					{label: 'Bay Terminal', values: [9.4, 17.8, 25.9, 31.6]},
					{label: 'East Gate', values: [14.6, 16.2, 17.0, 18.8]},
					{label: 'Delta Quay', values: [6.1, 11.4, 19.7, 23.3]},
					{label: 'Old Pier', values: [12.0, 12.6, 13.1, 13.4]},
				]}
				seed="run-25"
			/>
		),
	},
	{id: 'PlayingGrid', ...D.PLAYING_GRID, render: (tk, f) => <D.PlayingGrid tk={tk} frame={f} box={B.PlayingGrid} label="COMMITS · 20 WEEKS" unit="commits" total={1284} marks={['JAN', 'FEB', 'MAR', 'APR', 'MAY']} caption="Sample activity log" seed="grid-25" />},
	{id: 'GridCollapse', ...D.GRID_COLLAPSE, render: (tk, f) => <D.GridCollapse tk={tk} frame={f} box={B.GridCollapse} keep={7} label="100 STARTUPS · SAMPLE" caption="Seven are still standing after ten years." seed="collapse-25" />},
	{
		id: 'NLETimeline',
		...D.NLE_TIMELINE,
		render: (tk, f) => (
			<D.NLETimeline
				tk={tk}
				frame={f}
				box={B.NLETimeline}
				title="THE ARC · SAMPLE"
				span={[1994, 2026]}
				clips={[
					{label: 'Garage', start: 1994, end: 2001, track: 1},
					{label: 'Boom', start: 2001, end: 2008, track: 1},
					{label: 'Crash', start: 2008, end: 2014, track: 0},
					{label: 'Rebuild', start: 2014, end: 2026, track: 1},
					{label: 'Press', start: 2000, end: 2010, track: 2},
				]}
				seed="nle-25"
			/>
		),
	},
	{id: 'Keycaps', ...D.KEYCAPS, render: (tk, f) => <D.Keycaps tk={tk} frame={f} box={B.Keycaps} keys={['CTRL', 'SHIFT', 'Z']} label="ONE SHORTCUT" result="Redo, not undo." seed="keys-25" />},
];

const resolve = ({style = 'dark-neon-dataviz', palette, pairing}: SheetProps) => {
	const ds = SYSTEMS.find((d) => d.style === style) ?? SYSTEMS[0];
	const tk = D.dataTokens(ds, palette, pairing);
	const fonts = (ds.fonts.find((p) => p.id === pairing) ?? ds.fonts[0]) as Pairing;
	return {tk, fonts};
};

const Cell: React.FC<{tk: D.DataTokens; n: number; e: Entry; frame: number}> = ({tk, n, e, frame}) => (
	<AbsoluteFill style={{background: tk.c.bg, overflow: 'hidden'}}>
		<div style={{position: 'absolute', left: 0.08 * 1080, top: 0.08 * 1920, width: 0.76 * 1080, height: 0.03 * 1920, display: 'flex', alignItems: 'center'}}>
			<span style={txt(tk, 'mono', tk.size.label, tk.on('bg').hex)}>{`${String(n + 20).padStart(2, '0')}  ${e.id}`}</span>
		</div>
		{e.render(tk, frame)}
	</AbsoluteFill>
);

export const DA_SHEET_COLS = 5;
export const DATA_SHEET_SIZE = {width: 1080 * DA_SHEET_COLS, height: 1920 * Math.ceil(DATA.length / DA_SHEET_COLS)};
export const DATA_REEL_FRAMES = DATA.reduce((s, e) => s + e.frames, 0);

/** Every widget frozen on its hero frame, 5 x 2. `at` overrides the frame for all cells. */
export const DataSheet: React.FC<SheetProps & {at?: number}> = (p) => {
	const {tk, fonts} = resolve(p);
	return (
		<FontGate fonts={fonts}>
			<AbsoluteFill style={{background: tk.c.ink}}>
				{DATA.map((e, i) => (
					<div key={e.id} style={{position: 'absolute', left: (i % DA_SHEET_COLS) * 1080, top: Math.floor(i / DA_SHEET_COLS) * 1920, width: 1080, height: 1920, overflow: 'hidden'}}>
						<Freeze frame={p.at ?? e.hero}>
							<Cell tk={tk} n={i + 1} e={e} frame={p.at ?? e.hero} />
						</Freeze>
					</div>
				))}
			</AbsoluteFill>
		</FontGate>
	);
};

const Live: React.FC<{tk: D.DataTokens; n: number; e: Entry}> = ({tk, n, e}) => <Cell tk={tk} n={n} e={e} frame={useCurrentFrame()} />;

/** All 10 widgets back to back, each in its own Sequence (local frame from 0). */
export const DataReel: React.FC<SheetProps> = (p) => {
	const {tk, fonts} = resolve(p);
	let from = 0;
	return (
		<FontGate fonts={fonts}>
			<AbsoluteFill style={{background: tk.c.bg}}>
				{DATA.map((e, i) => {
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
