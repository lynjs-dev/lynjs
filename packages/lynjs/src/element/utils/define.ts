import type { ControllerClass, HostClass } from '../types/element.d.ts';
import { HostFactoryOptions, RuntimeEnvironment, triggerHmrSwap, hostFactory } from '../host.ts';

type HotData = {
  elements: Record<string, HostClass>;
};

interface ImportMetaHot {
  data?: HotData;
  accept(cb?: (mod: unknown) => void): void;
  dispose(cb: (data: Record<string, unknown>) => void): void;
  decline?(): void;
  invalidate?(): void;
  on?(event: string, cb: (...args: unknown[]) => void): void;
}

interface ImportMetaWithHot extends ImportMeta {
  readonly hot?: ImportMetaHot;
}

export interface DefineElementOptions extends HostFactoryOptions, ElementDefinitionOptions {
  /**
   * Whether to register the element in the DOM environment.
   *
   * Defaults to `true` when running in a DOM environment.
   */
  register?: boolean;
}

/**
 * True when running in an environment that provides Custom Elements.
 *
 * This intentionally ignores legacy browsers that do not support
 * `customElements` natively.
 */
const isDomEnv = typeof customElements !== 'undefined';

/**
 * Define a LynJS host element for the given controller.
 *
 * - In DOM environments, optionally registers the element via `customElements.define`.
 * - In HMR environments, reuses the existing host constructor and swaps the
 *   controller implementation in-place to preserve DOM/state.
 */

export function defineElement<T extends ControllerClass = ControllerClass>(
  tag: string,
  ctorClass: T,
  options?: DefineElementOptions,
): HostClass {
  const env: RuntimeEnvironment = options?.env ?? (isDomEnv ? 'dom' : 'ssr');

  const hot = (import.meta as ImportMetaWithHot).hot;
  if (hot && !hot.data) hot.data = { elements: {} };

  const elements = hot?.data?.elements ?? {};

  const HostCtor = elements[tag] ?? hostFactory.resolve(ctorClass, { ...(options ?? {}), env }, tag);

  if (tag in elements) {
    // HMR: reuse existing host constructor and swap controller implementation
    // in-place so that DOM structure and state are preserved.
    triggerHmrSwap<T>(tag, ctorClass);
  } else if (env === 'dom' && isDomEnv && (options?.register ?? true) && !customElements.get(tag)) {
    customElements.define(tag, HostCtor as unknown as CustomElementConstructor);
  }

  // if (hot && hot.data) hot.data.elements[tag] = HostCtor;

  return HostCtor;
}
