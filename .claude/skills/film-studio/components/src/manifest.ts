/**
 * The render-manifest contract (schemas/render-manifest.schema.json) as TypeScript, plus the pure helpers
 * FilmComposition needs for audio. Every value is in frames; colours and fonts are role names.
 */
export type Pct = {x: number; y: number; w: number; h: number};
export type ShapeDef = {t: 'rect' | 'ellipse' | 'poly' | 'line' | 'path'; fill?: string; stroke?: string; [k: string]: unknown};
export type CastEntry = {id: string; name?: string; role: 'narrator' | 'actor' | 'prop'; layers: {name: string; depth?: number; shapes: ShapeDef[]}[]; rig?: Record<string, unknown>};
export type BoxDef = Pct & {id: string; kind: 'text' | 'caption' | 'face' | 'card' | 'widget' | 'subject' | 'decor'; role?: 'display' | 'body' | 'label' | 'caption'; text?: string; lines?: string[]; px?: number; color?: string; bg?: string; font?: 'display' | 'body' | 'accent' | 'mono'; from?: number; to?: number};
export type Primitive = 'spring-overshoot' | 'gravity-drop' | 'pull-back-zoom' | 'whip-pan' | 'dolly-push' | 'text-decode' | 'odometer-roll' | 'path-draw-on' | 'axis-flip' | 'rgb-split-glitch' | 'stop-motion-jitter' | 'film-gate';
export type MotionDef = {primitive: Primitive; frame: number; frames?: number; target?: string; params?: Record<string, unknown>; note?: string};
export type PanelDefM = {
	id: string;
	scene: string;
	from: number;
	frames: number;
	max_hold_seconds: number;
	transition?: {primitive: 'cut' | 'whip-pan' | 'axis-flip' | 'pull-back-zoom' | 'dolly-push'; frames: number; easing?: string};
	boxes: BoxDef[];
	cast: {id: string; box: Pct; flip?: boolean; from?: number}[];
	widgets: {id: string; anchor: string; from: number; frames: number; box: Pct; props: Record<string, unknown>}[];
	motion: MotionDef[];
	beats: {frame: number; frames?: number; kind: string; target?: string; easing?: string}[];
	fx?: {id: string; from: number; frames: number; params?: Record<string, unknown>}[];
};
export type SfxCue = {id: string; frame: number; peak_frame: number; pre_roll: number; db: number; sync: string; file: string | null};
export type Music = {file: string; open_db: number; ducked_db: number; attack_frames: number; release_frames: number; merge_gaps_under: number; cuts?: {from: number; to: number}[]};
export type RenderManifest = {
	version: 1;
	meta: {title: string; platform: string; ratio: '9:16' | '16:9' | '1:1' | '4:5'; fps: number; width: number; height: number; frames: number; safe: {top: number; right: number; bottom: number; left: number}};
	design: {style: string; palette_id: string; palette_tier: 'focused' | 'expanded'; palette_size: number; pairing_id: string; seed: string};
	subject_mode: 'ui-first' | 'layered';
	cast: CastEntry[];
	panels: PanelDefM[];
	captions: {from: number; to: number; text: string; power?: string}[];
	audio: {sfx: SfxCue[]; voiceover: {clips: {file: string; from: number}[]; segments: [number, number][]} | null; music: Music | null};
	showSafeZones: boolean;
};

export const dbToGain = (db: number) => Math.pow(10, db / 20);

/** Voice segments with gaps under `mergeUnder` frames joined, so the bed does not pump between phrases. */
export const mergeSegments = (segs: [number, number][], mergeUnder: number): [number, number][] => {
	const s = [...segs].sort((a, b) => a[0] - b[0]);
	const out: [number, number][] = [];
	for (const [a, b] of s) {
		const last = out[out.length - 1];
		if (last && a - last[1] < mergeUnder) last[1] = Math.max(last[1], b);
		else out.push([a, b]);
	}
	return out;
};

/**
 * Music gain at frame f (personas/sound-designer.md section 3). Open level between voice segments; ramps down
 * over `attack_frames` BEFORE each segment so the bed is fully ducked on the first word, holds ducked, and
 * ramps up over `release_frames` after. Ramps are linear in dB. A cut window is silence. Pure in f.
 */
export const duckedMusicGain = (f: number, m: Music, segments: [number, number][]) => {
	if ((m.cuts ?? []).some((c) => f >= c.from && f < c.to)) return 0;
	let duck = 0; // 0 = open, 1 = fully ducked
	for (const [a, b] of mergeSegments(segments, m.merge_gaps_under)) {
		let k = 0;
		if (f >= a && f <= b) k = 1;
		else if (f < a && f >= a - m.attack_frames) k = 1 - (a - f) / Math.max(1, m.attack_frames);
		else if (f > b && f <= b + m.release_frames) k = 1 - (f - b) / Math.max(1, m.release_frames);
		duck = Math.max(duck, k);
	}
	return dbToGain(m.open_db + (m.ducked_db - m.open_db) * duck);
};

/** The caption chunk on screen at frame f, if any. */
export const captionAt = (caps: RenderManifest['captions'], f: number) => caps.find((c) => f >= c.from && f < c.to) ?? null;
