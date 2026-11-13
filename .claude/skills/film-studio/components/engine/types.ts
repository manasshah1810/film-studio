import type React from 'react';

/** Palette roles: every palette in every design-system.json has exactly these six. */
export type Role = 'bg' | 'ink' | 'primary' | 'secondary' | 'highlight' | 'shadow';
export type Roles = Record<Role, string>;
export type FontRole = {family: string; weight: number; tracking: number; lineHeight: number; case?: 'upper' | 'lower' | 'none'; italic?: boolean};
export type Pairing = {id: string; name: string; display: FontRole; body: FontRole; accent: FontRole; mono: FontRole; scale?: number};
export type Bezier = [number, number, number, number];

export type DesignSystem = {
	style: string;
	palettes: {id: string; name: string; mood: string; best_for: string[]; roles: Roles}[];
	fonts: (Pairing & {mood: string})[];
	contrast_pairs: [Role, Role, number][];
	type_scale: Record<'hero' | 'h1' | 'h2' | 'body' | 'label' | 'numeral', number>;
	motion: {fps: number; hold: number; easings: Record<string, Bezier>; enter_frames: number; stagger_frames: number; min_hold_frames: number; camera: string};
	textures: Record<string, number | string | number[]>;
	figure: FigureTemplate;
	composition: {margin: number; align: 'left' | 'center' | 'right'; anchors: string[]; tilt: [number, number]};
	signature_moves: {name: string; recipe: string}[];
	forbidden: string[];
};

export type FigureTemplate = {
	head: number; // head radius in figure units (figure box is 100 x 200)
	headShape: 'round' | 'oval' | 'block' | 'none';
	body: 'line' | 'bean' | 'block' | 'taper' | 'drop';
	bodyW: number;
	limb: number; // limb thickness
	limbStyle: 'line' | 'noodle' | 'block';
	legLen: number; // leg share of the body below the head (weighed against torso)
	torso?: number; // torso share, default 50
	armLen: number;
	face: 'dots' | 'brows' | 'none' | 'visor' | 'line';
	hands: boolean;
	feet: boolean;
	skin?: Role;
	limbRole?: 'ink' | 'color' | 'skin';
};

/** The design the Director locked for one film. Same object for every scene. */
export type Design = {
	style: string;
	palette: {id: string; roles: Roles};
	fonts: Pairing;
	seed: string;
	system: DesignSystem;
};

export type Shape = (
	| {t: 'rect'; x: number; y: number; w: number; h: number; r?: number; rot?: number}
	| {t: 'ellipse'; cx: number; cy: number; rx: number; ry: number; rot?: number}
	| {t: 'poly'; pts: number[][]; smooth?: boolean}
	| {t: 'line'; pts: number[][]; w: number; smooth?: boolean}
) & {fill?: Role | 'none'; stroke?: Role | 'none'; sw?: number; tag?: string};

export type CastDef =
	| {kind: 'character'; id: string; name?: string; color: Role; hair?: 'none' | 'short' | 'bun' | 'spike' | 'cap' | 'long'; build?: 'slim' | 'mid' | 'broad'; accessory?: 'none' | 'tie' | 'glasses' | 'crown' | 'scarf'; species?: 'human' | 'cat'}
	| {kind: 'prop'; id: string; name?: string; base?: string; vb?: [number, number]; shapes?: Shape[]}
	| {kind: 'media'; id: string; file: string; credit: string};

export type Pose = 'idle' | 'point' | 'walk' | 'cheer' | 'slump' | 'think' | 'shrug' | 'run' | 'hold' | 'fall' | 'reach';
export type Expr = 'neutral' | 'happy' | 'worried' | 'shocked' | 'smug' | 'sad' | 'angry';

export type ChartSpec = {
	type: 'line' | 'bar' | 'area';
	series: {name: string; role?: Role; values: number[]}[];
	x: string[];
	unit?: string;
	annot?: {at: number; series?: number; text: string};
	max?: number;
};

export type Layout = 'title' | 'stat' | 'figure' | 'versus' | 'chart' | 'object' | 'quote' | 'timeline' | 'list';
export type Slots = {
	kicker?: string;
	headline?: string;
	sub?: string;
	emphasis?: string;
	stat?: {value: string; unit?: string; label?: string};
	cast?: {id: string; pose?: Pose; expr?: Expr; flip?: boolean; says?: string}[];
	prop?: {id: string; state?: 'normal' | 'broken' | 'glow' | 'small'};
	chart?: ChartSpec;
	sides?: {label: string; value?: string; prop?: string; cast?: string; pose?: Pose; expr?: Expr; win?: boolean}[];
	quote?: {text: string; by?: string};
	points?: {when: string; what: string; hot?: boolean}[];
	items?: string[];
	media?: string;
};
export type FxUse = {id: string; start: number; duration: number; params?: Record<string, unknown>};
export type PanelDef = {
	id: string;
	duration: number; // seconds
	layout: Layout;
	slots: Slots;
	anchor?: string; // tl t tr l c r bl b br
	scale?: 'tight' | 'mid' | 'wide';
	energy?: 'calm' | 'build' | 'peak' | 'release';
	accent?: Role;
	caption?: string;
	fx?: FxUse[];
};
export type FilmDef = {
	meta: {title: string; platform: string; ratio: '9:16' | '16:9' | '1:1' | '4:5'; fps: number; width: number; height: number; safe: {top: number; right: number; bottom: number; left: number}; captions?: boolean};
	design: Omit<Design, 'system'> & {system?: DesignSystem};
	cast: Record<string, CastDef>;
	scenes: {id: string; panels: PanelDef[]}[];
	audio?: {file: string; start: number}[];
};

/** k scales the type-size cap for text fitted into this zone (set by the layout engine). */
export type Zone = {x: number; y: number; w: number; h: number; k?: number};
export type Zones = Record<string, Zone>;

/** What every style kit receives for one element. p = entrance progress 0..1, t = panel-local frame. */
export type El = {zone: Zone; p: number; t: number; seed: string};
export type Align = 'left' | 'center' | 'right';
export type Kit = {
	Backdrop: React.FC<{panel: PanelDef; t: number; dur: number}>;
	Headline: React.FC<El & {text: string; emphasis?: string; level: 'hero' | 'h1' | 'h2'; align?: Align; accent?: Role}>;
	Label: React.FC<El & {text: string; kind: 'kicker' | 'sub' | 'label' | 'body' | 'attrib'; align?: Align; accent?: Role}>;
	Numeral: React.FC<El & {value: string; unit?: string; align?: Align; accent?: Role}>;
	Marks: React.FC<El & {shapes: Shape[]; vb: [number, number]; flip?: boolean; kind: 'figure' | 'prop'; state?: string}>;
	Chart: React.FC<El & {chart: ChartSpec; accent?: Role}>;
	Decor?: React.FC<{panel: PanelDef; zones: Zones; t: number; dur: number; p: number}>;
	Finish?: React.FC<{panel: PanelDef; t: number; dur: number}>;
	Bubble?: React.FC<El & {text: string; tail: 'left' | 'right'}>;
	/** Full override for one layout when the shared assembly is not right for the style. */
	layouts?: Partial<Record<Layout, React.FC<{panel: PanelDef; zones: Zones; t: number; dur: number}>>>;
	/** Zone adjustments per style (e.g. comic gutters, letterbox). */
	zones?: (z: Zones, panel: PanelDef, frame: Zone) => Zones;
};
