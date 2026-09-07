import { reactiveContext } from './reactive-context';

export { createEffect, effect, onCleanup, ReactiveEffect } from './reactive-effect';
export type { Cleanup } from './reactive-effect';
export { connected, createScope, getOwner, ReactiveScope, root } from './reactive-scope';
export type { Connected, Disconnected, Stop } from './reactive-scope';
export { signal, Signal } from './signal';

export const sharedConfig: Record<string, unknown> = {};

export function memo<T>(fn: () => T): () => T {
  return fn;
}

export function createComponent<T>(component: (props: T) => Node, props: T): Node {
  return component(props);
}

export function untrack<T>(fn: () => T): T {
  return reactiveContext.runUntracked(fn);
}

export function mergeProps(...sources: object[]): object {
  return Object.assign({}, ...sources);
}
