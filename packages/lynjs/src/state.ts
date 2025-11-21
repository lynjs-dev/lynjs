export type State = Map<string | symbol, unknown>;

const stateStorage = new WeakMap<object, State>();

function setValue<T>(obj: object, key: string | symbol, value: T): void {
  const map = stateStorage.get(obj) || new Map();
  stateStorage.set(obj, map);
  map.set(key, value);
}

function getValue<T>(obj: object, key: string | symbol, defaultValue?: T): T | undefined {
  const map = stateStorage.get(obj) || new Map();
  if (!map || !map.has(key)) return defaultValue;
  return map.get(key) as T;
}

function get(obj: object): State {
  const state = stateStorage.get(obj) || new Map();
  stateStorage.set(obj, state);
  return state;
}

export const state = {
  get,
  getValue,
  setValue,
};

Object.freeze(state);

export default state;
