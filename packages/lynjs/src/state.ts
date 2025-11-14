export type State = Map<string | symbol, unknown>;

const states = new WeakMap<object, State>();

export const STATE = Symbol('state');

export function createState(obj: object): State {
  const state = states.get(obj) || new Map();
  states.set(obj, state);
  return state;
}

export function setState<T>(obj: object, key: string | symbol, value: T): void {
  const map = states.get(obj) || new Map();
  states.set(obj, map);
  map.set(key, value);
}

export function getState<T>(obj: object, key: string | symbol, defaultValue?: T): T | undefined {
  const map = states.get(obj) || new Map();
  if (!map || !map.has(key)) return defaultValue;
  return map.get(key) as T;
}

export default {
  setState,
  getState,
};
