import { JSX } from '../types/jsx.js';

type PropsWithChildren<P> = P & { children?: JSX.Element };
type FunctionComponent<P = object> = (props: PropsWithChildren<P>) => JSX.Element;
type ComponentConstructor<P> = FunctionComponent<P> | (new (props: PropsWithChildren<P>) => JSX.Element);

type Effect<T> = (prev?: T) => T;
export type Signal<T = unknown> = {
  get: () => T;
  set: (newValue: T) => void;
};

class ReactiveContext {
  effectStack!: Effect<unknown>[];

  constructor() {
    this.effectStack = [];
  }

  // public scopeStack: ReactiveScope[] = [];

  // get currentScope(): ReactiveScope | null {
  //   const scope = this.scopeStack[this.scopeStack.length - 1];
  //   if (!scope) return null;
  //   return scope;
  // }
  //

  getEffectStacks<T>(): Effect<T>[] {
    return this.effectStack as Effect<T>[];
  }

  getCurrentEffect<T>(): Effect<T> | null {
    const effect = this.effectStack[this.effectStack.length - 1];
    if (!effect) return null;
    return effect as Effect<T>;
  }

  // runWithScope<T>(scope: ReactiveScope, fn: () => T): T {
  //   this.scopeStack.push(scope);
  //   try {
  //     return fn();
  //   } finally {
  //     this.scopeStack.pop();
  //   }
  // }
}

const reactiveContext = new ReactiveContext();

/**
 * Creates a reactive signal holding a default of type P.
 * The signal tracks effects that depend on it and notifies them on changes.
 * Signals should not be held globally to prevent memory leaks; manage their lifecycle within scopes.
 */
export function createSignal<T>(value?: T): Signal<T> {
  const effects = new Set<Effect<T>>();

  return {
    get: () => {
      const currentEffect = reactiveContext.getCurrentEffect<T>();
      if (currentEffect !== null) effects.add(currentEffect);
      return value as T;
    },
    set: (newValue: T) => {
      if (Object.is(newValue, value)) return;
      value = newValue;
      for (const effect of effects) effect();
    },
  };
}

export function root<T>(fn: () => T, _owner?: unknown): () => void {
  fn();
  return () => {};
}

export function effect<T>(fn: Effect<T>, current?: T) {
  const effectStack = reactiveContext.getEffectStacks<T>();
  effectStack.push(fn);
  try {
    fn(current);
  } finally {
    effectStack.pop();
  }
}

export function memo<T>(_fn: () => T, _equal?: boolean) {}

export function createComponent<T extends { children?: JSX.Element }>(
  _Comp: ComponentConstructor<T>,
  _props: T,
): JSX.Element {
  console.log('createComponent...');
  return null;
}

export function untrack<T>(_fn: () => T): T {
  return null as T;
}

export const getOwner = null;
export const mergeProps = null;
export const sharedConfig = {};
