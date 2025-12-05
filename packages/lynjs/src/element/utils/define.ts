import type { ControllerClass, HostClass } from '../types/element.d.ts';
import { BaseHost } from '../host.ts';
import { env } from '../../env.ts';

type HotData = { elements: Record<string, HostClass> };

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

const LOCAL_ELEMENTS: Record<string, HostClass> = {};

function assertCustomElementName(tag: string) {
  if (!/^[a-z][0-9a-z._-]*-[0-9a-z._-]*$/.test(tag)) {
    throw new SyntaxError(
      `Invalid custom element name: "${tag}". It must contain a hyphen and be lowercase. Got "${tag}".`,
    );
  }
}

function assertCustomElementConsistency(
  tag: string,
  CustomElement: CustomElementConstructor,
  Controller: ControllerClass,
) {
  const existing = typeof customElements === 'undefined' ? undefined : customElements.get(tag);
  if (existing !== undefined && existing !== CustomElement) {
    throw new Error(
      `Custom element "${tag}" is already defined with a different constructor. ` +
        `registered=${(existing as { name: string })?.name ?? '<unknown>'}, ` +
        `attempted=${Controller.name || '<anonymous>'}. ` +
        `This usually indicates duplicate bundles or a stale HMR cache.`,
    );
  }
}

export type DefineElementOptions = ElementDefinitionOptions;

export function defineElement<T extends ControllerClass = ControllerClass>(
  tag: string,
  Controller: T,
  options?: DefineElementOptions,
): HostClass {
  const hot = (import.meta as ImportMetaWithHot).hot ?? { data: { elements: LOCAL_ELEMENTS } };
  if (!hot?.data) hot.data = { elements: LOCAL_ELEMENTS };
  if (!hot?.data?.elements) hot.data.elements = LOCAL_ELEMENTS;
  const elements = hot?.data?.elements;

  const HostClass = tag in elements ? elements[tag] : class extends BaseHost {};
  Object.defineProperty(HostClass, 'Controller', { get: () => Controller, configurable: true });
  Object.defineProperty(HostClass, 'tagName', { get: () => tag, configurable: false });

  assertCustomElementName(tag);
  assertCustomElementConsistency(tag, HostClass as unknown as CustomElementConstructor, Controller);

  if (tag in elements && env.isDev) {
    // todo: 개발 환경에서만 triggerHmrSwap<T>(HostClass)
  } else if (tag in elements) {
    throw new Error(`Custom element "${tag}" is already defined.`);
  } else if (typeof customElements !== 'undefined' && !customElements.get(tag)) {
    customElements.define(tag, HostClass as unknown as CustomElementConstructor, options);
  }

  elements[tag] = HostClass;
  return HostClass;
}
