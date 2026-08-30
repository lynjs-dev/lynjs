export const sharedConfig: Record<string, unknown> = {};

export function root<T>(fn: (dispose: () => void) => T): T {
  return fn(() => {});
}

export function effect<T>(fn: (previous?: T) => T, initial?: T): T {
  return fn(initial);
}

export function memo<T>(fn: () => T): () => T {
  return fn;
}

export function getOwner(): undefined {
  return undefined;
}

export function createComponent<T>(component: (props: T) => Node, props: T): Node {
  return component(props);
}

export function untrack<T>(fn: () => T): T {
  return fn();
}

export function mergeProps(...sources: object[]): object {
  return Object.assign({}, ...sources);
}
