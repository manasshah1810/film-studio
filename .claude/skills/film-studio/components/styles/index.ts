import type {Kit} from '../engine/types';

/**
 * One kit per style id. A style without a kit cannot be rendered and must not be offered.
 * Empty on purpose: the 12 legacy kits were removed (POST_MORTEM.md). Register each new style
 * from references/style-cheatsheet.md here as it is built.
 */
export const KITS: Record<string, Kit> = {};
