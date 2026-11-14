// GENERATED from library/widgets.json by the prompt 32 build. Do not edit by hand: regenerate after adding a widget.
/**
 * id -> component for the 50 micro-widgets. FilmComposition mounts any of them by the id a storyboard or
 * render-manifest names. Each family has its own token adapter; all read the ONE active design-system.json.
 */
import type React from 'react';
import * as social from './social';
import * as editorial from './editorial';
import * as data from './data';
import * as camera from './camera';
import * as kinetic from './kinetic';

export type WidgetFamily = 'social' | 'editorial' | 'data' | 'camera' | 'kinetic';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyWidget = React.FC<any>;
export type WidgetEntry = {family: WidgetFamily; Component: AnyWidget; frames: number; hero: number};

/** Token adapter per family: (design-system json, palette id, pairing id) -> the tokens every widget of that family reads. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const WIDGET_TOKENS: Record<WidgetFamily, (ds: any, palette?: string, pairing?: string) => unknown> = {
	social: social.socialTokens,
	editorial: editorial.editorialTokens,
	data: data.dataTokens,
	camera: camera.cameraTokens,
	kinetic: kinetic.kineticTokens,
};

export const WIDGETS: Record<string, WidgetEntry> = {
	'live-cursor': {family: 'social', Component: social.LiveCursor as AnyWidget, frames: 90, hero: 58},
	'comment-drop': {family: 'social', Component: social.CommentDrop as AnyWidget, frames: 90, hero: 72},
	'voice-note': {family: 'social', Component: social.VoiceNote as AnyWidget, frames: 90, hero: 62},
	'post-wall': {family: 'social', Component: social.PostWall as AnyWidget, frames: 90, hero: 74},
	'reel-feed': {family: 'social', Component: social.ReelFeed as AnyWidget, frames: 90, hero: 37},
	'reel-cascade': {family: 'social', Component: social.ReelCascade as AnyWidget, frames: 90, hero: 60},
	'video-card': {family: 'social', Component: social.VideoCard as AnyWidget, frames: 90, hero: 70},
	'comment-cta': {family: 'social', Component: social.CommentCTA as AnyWidget, frames: 90, hero: 72},
	'prompt-bar': {family: 'social', Component: social.PromptBar as AnyWidget, frames: 100, hero: 92},
	'jiggle-delete': {family: 'social', Component: social.JiggleDelete as AnyWidget, frames: 90, hero: 43},
	'magazine-cover': {family: 'editorial', Component: editorial.MagazineCover as AnyWidget, frames: 90, hero: 72},
	'press-front': {family: 'editorial', Component: editorial.PressFront as AnyWidget, frames: 90, hero: 84},
	'paper-tear': {family: 'editorial', Component: editorial.PaperTear as AnyWidget, frames: 90, hero: 52},
	'screenplay-page': {family: 'editorial', Component: editorial.ScreenplayPage as AnyWidget, frames: 110, hero: 104},
	'serif-stamp': {family: 'editorial', Component: editorial.SerifStamp as AnyWidget, frames: 90, hero: 60},
	'live-markup': {family: 'editorial', Component: editorial.LiveMarkup as AnyWidget, frames: 100, hero: 94},
	'sketch-words': {family: 'editorial', Component: editorial.SketchWords as AnyWidget, frames: 90, hero: 84},
	'grease-pencil-sheet': {family: 'editorial', Component: editorial.GreasePencilSheet as AnyWidget, frames: 90, hero: 80},
	'contact-sheet-hook': {family: 'editorial', Component: editorial.ContactSheetHook as AnyWidget, frames: 100, hero: 94},
	'title-card': {family: 'editorial', Component: editorial.TitleCard as AnyWidget, frames: 90, hero: 70},
	'clone-row': {family: 'data', Component: data.CloneRow as AnyWidget, frames: 90, hero: 82},
	'day-dial': {family: 'data', Component: data.DayDial as AnyWidget, frames: 90, hero: 84},
	'orbit-ring': {family: 'data', Component: data.OrbitRing as AnyWidget, frames: 90, hero: 84},
	'code-body': {family: 'data', Component: data.CodeBody as AnyWidget, frames: 120, hero: 114},
	'banknote': {family: 'data', Component: data.Banknote as AnyWidget, frames: 100, hero: 94},
	'running-list': {family: 'data', Component: data.RunningList as AnyWidget, frames: 120, hero: 116},
	'playing-grid': {family: 'data', Component: data.PlayingGrid as AnyWidget, frames: 100, hero: 94},
	'grid-collapse': {family: 'data', Component: data.GridCollapse as AnyWidget, frames: 110, hero: 104},
	'nle-timeline': {family: 'data', Component: data.NLETimeline as AnyWidget, frames: 110, hero: 104},
	'keycaps': {family: 'data', Component: data.Keycaps as AnyWidget, frames: 90, hero: 72},
	'rack-focus': {family: 'camera', Component: camera.RackFocus as AnyWidget, frames: 96, hero: 56},
	'impact-frame': {family: 'camera', Component: camera.ImpactFrame as AnyWidget, frames: 60, hero: 15},
	'dolly-zoom': {family: 'camera', Component: camera.DollyZoom as AnyWidget, frames: 96, hero: 78},
	'blade-slice': {family: 'camera', Component: camera.BladeSlice as AnyWidget, frames: 72, hero: 24},
	'film-look': {family: 'camera', Component: camera.FilmLook as AnyWidget, frames: 90, hero: 62},
	'lens-ring': {family: 'camera', Component: camera.LensRing as AnyWidget, frames: 96, hero: 82},
	'grade-slider': {family: 'camera', Component: camera.GradeSlider as AnyWidget, frames: 96, hero: 90},
	'eyedropper-grade': {family: 'camera', Component: camera.EyedropperGrade as AnyWidget, frames: 110, hero: 104},
	'file-drop': {family: 'camera', Component: camera.FileDrop as AnyWidget, frames: 100, hero: 94},
	'icon-strike': {family: 'camera', Component: camera.IconStrike as AnyWidget, frames: 72, hero: 66},
	'head-stack': {family: 'kinetic', Component: kinetic.HeadStack as AnyWidget, frames: 84, hero: 76},
	'letter-dive': {family: 'kinetic', Component: kinetic.LetterDive as AnyWidget, frames: 72, hero: 28},
	'picture-dive': {family: 'kinetic', Component: kinetic.PictureDive as AnyWidget, frames: 90, hero: 40},
	'layer-explode': {family: 'kinetic', Component: kinetic.LayerExplode as AnyWidget, frames: 96, hero: 48},
	'blow-away': {family: 'kinetic', Component: kinetic.BlowAway as AnyWidget, frames: 84, hero: 30},
	'knockout-captions': {family: 'kinetic', Component: kinetic.KnockoutCaptions as AnyWidget, frames: 96, hero: 46},
	'kinetic-hook': {family: 'kinetic', Component: kinetic.KineticHook as AnyWidget, frames: 84, hero: 60},
	'gravity-drop': {family: 'kinetic', Component: kinetic.GravityDrop as AnyWidget, frames: 72, hero: 66},
	'giant-captions': {family: 'kinetic', Component: kinetic.GiantCaptions as AnyWidget, frames: 84, hero: 42},
	'storyboard-deck': {family: 'kinetic', Component: kinetic.StoryboardDeck as AnyWidget, frames: 96, hero: 90},
};
