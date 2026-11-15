/**
 * id -> bespoke topic scene. A bespoke scene is coded for one topic's story beat (kit.ts holds the contract) and
 * placed by a storyboard panel's "bespoke" list. scripts/build-film.js reads the ids below (one per line, '<topic>/<scene>':).
 */
import type {BespokeScene} from './kit';
import {BrokenChain} from './onecoin/BrokenChain';
import {TypedLedger} from './onecoin/TypedLedger';
import {ArenaPitch} from './onecoin/ArenaPitch';
import {RecruitPyramid} from './onecoin/RecruitPyramid';
import {FlightVanish} from './onecoin/FlightVanish';
import {CoinPackages} from './onecoin/CoinPackages';

export const BESPOKE: Record<string, BespokeScene> = {
	'onecoin/broken-chain': BrokenChain,
	'onecoin/typed-ledger': TypedLedger,
	'onecoin/arena-pitch': ArenaPitch,
	'onecoin/recruit-pyramid': RecruitPyramid,
	'onecoin/flight-vanish': FlightVanish,
	'onecoin/coin-packages': CoinPackages,
};
