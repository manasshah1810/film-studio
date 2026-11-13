import type {Kit} from '../engine/types';
import {kit as whiteboard} from './whiteboard/kit';
import {kit as cartoon} from './cartoon/kit';
import {kit as infographic} from './infographic/kit';
import {kit as kinetic} from './kinetic/kit';
import {kit as comic} from './comic/kit';
import {kit as sketchbook} from './sketchbook/kit';
import {kit as pixel} from './pixel/kit';
import {kit as cutout} from './cutout/kit';
import {kit as watercolor} from './watercolor/kit';
import {kit as noir} from './noir/kit';
import {kit as blueprint} from './blueprint/kit';
import {kit as riso} from './riso/kit';

/** One kit per style id. A style without a kit cannot be rendered and must not be offered. */
export const KITS: Record<string, Kit> = {whiteboard, cartoon, infographic, kinetic, comic, sketchbook, pixel, cutout, watercolor, noir, blueprint, riso};
