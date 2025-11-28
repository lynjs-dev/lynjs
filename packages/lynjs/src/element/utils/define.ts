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
  register?: boolean;
}

const isDomEnv = typeof customElements !== 'undefined';

export function defineElement<T extends ControllerClass = ControllerClass>(
  tag: string,
  ctorClass: T,
  options?: DefineElementOptions,
): HostClass {
  const env: RuntimeEnvironment = options?.env ?? (isDomEnv ? 'dom' : 'ssr');

  const hot = (import.meta as ImportMetaWithHot).hot;
  if (hot && !hot.data) hot.data = { elements: {} };

  const elements = hot?.data?.elements ?? {};

  const HostClass = elements[tag] ?? hostFactory.resolve(ctorClass, { ...(options ?? {}), env }, tag);

  if (tag in elements) {
    triggerHmrSwap<T>(tag, ctorClass);
  } else if (env === 'dom' && isDomEnv && (options?.register ?? true) && !customElements.get(tag)) {
    customElements.define(tag, HostClass as unknown as CustomElementConstructor);
  }

  return HostClass;
}
