import React, {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import type {Pairing} from './types';
import {FONT_LOADERS} from './fonts.generated';
import {CSS_FAMILY} from './tokens';

/**
 * Loads the film's ONE font pairing through @remotion/google-fonts and blocks rendering until
 * every face is ready. A family that is not in the generated map throws: fonts outside the
 * design systems cannot be used.
 */
export const FontGate: React.FC<{fonts: Pairing; children: React.ReactNode}> = ({fonts, children}) => {
	const [ready, setReady] = useState(false);
	const [handle] = useState(() => delayRender('film-studio fonts'));
	useEffect(() => {
		const need = new Map<string, {w: Set<string>; italic: boolean}>();
		for (const r of [fonts.display, fonts.body, fonts.accent, fonts.mono]) {
			const e = need.get(r.family) ?? {w: new Set<string>(), italic: false};
			e.w.add(String(r.weight));
			e.italic = e.italic || !!r.italic;
			need.set(r.family, e);
		}
		Promise.all(
			[...need.entries()].map(async ([family, e]) => {
				const load = FONT_LOADERS[family];
				if (!load) throw new Error(`film-studio: font "${family}" is not in any design-system.json (run scripts/gen-fonts.js)`);
				const mod = await load();
				const opts = {weights: [...e.w], subsets: ['latin']} as never;
				const first = mod.loadFont('normal', opts);
				CSS_FAMILY[family] = first.fontFamily;
				const jobs = [first.waitUntilDone()];
				if (e.italic) jobs.push(mod.loadFont('italic', opts).waitUntilDone());
				await Promise.all(jobs);
			}),
		)
			.then(() => document.fonts.ready)
			.then(() => {
				setReady(true);
				continueRender(handle);
			});
	}, [fonts, handle]);
	return ready ? <>{children}</> : null;
};
