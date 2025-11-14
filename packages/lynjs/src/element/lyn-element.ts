import { JSX } from '../../types/jsx.js';
import { ComponentController, PersistedState } from './types/component.js';

export class LynElement implements ComponentController {
  [key: string | symbol]: unknown;

  static readonly useShadow = true as const;

  constructor(state: PersistedState = {}) {
    for (const key in state) this[key] = state[key];
  }

  render(): JSX.Element {
    return null;
  }
}
