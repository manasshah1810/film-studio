// effect id (library/vfx/*.json) -> component. Each category file registers its effects on import.
// scripts/check-static.js fails the build if the library and this registry ever disagree.
import './camera';
import './transitions';
import './light';
import './texture';
import './emphasis';

export {EFFECTS} from './core';
export type {Fx, FxProps} from './core';
