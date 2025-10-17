type JSXElement = Node | ArrayElement | (string & {}) | number | boolean | null | undefined;
type ArrayElement = Array<Element>;

type PropsWithChildren<P> = P & { children?: JSXElement };
export type FunctionComponent<P = object> = (props: PropsWithChildren<P>) => JSXElement;
type ComponentConstructor<P> = FunctionComponent<P> | (new (props: PropsWithChildren<P>) => JSXElement);

export function root<T>(_fn: (dispose: () => void) => T, _owner?: unknown): () => void {
  return () => {};
}

export function effect<T>(_fn: (prev?: T) => T, _current?: T) {}

export function memo<T>(_fn: () => T, _equal?: boolean) {}

export function createComponent<T extends { children?: JSXElement }>(
  _Comp: ComponentConstructor<T>,
  _props: T,
): JSXElement {
  return null;
}

export function untrack<T>(_fn: () => T): T {
  return null as T;
}

export const getOwner = null;
export const mergeProps = null;
export const sharedConfig = {};
