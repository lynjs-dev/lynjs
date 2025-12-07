import type { ControllerClass, HostClass, HostContext } from '../types/element.d.ts';
import { definePrototypeDelegates } from './element.ts';
import { BaseHost } from '../host.ts';
import { env } from '../../env.ts';

export type DefineElementOptions = ElementDefinitionOptions;

type HotData = {
  elements: Record<string, HostClass>;
  delegates: Map<HostClass, (string | symbol)[]>;
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

const LOCAL_ELEMENTS: Record<string, HostClass> = {};
const DELEGATES: Map<HostClass, (string | symbol)[]> = new Map();

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

function deleteDelegates(Host: HostClass, delegates: (string | symbol)[]) {
  for (const key of delegates) {
    delete (Host.prototype as Record<string | symbol, unknown>)[key];
  }
}

export function defineElement<T extends ControllerClass = ControllerClass>(
  tag: string,
  Controller: T,
  options?: DefineElementOptions,
): HostClass {
  const hot = (import.meta as ImportMetaWithHot).hot ?? { data: { elements: LOCAL_ELEMENTS, delegates: DELEGATES } };
  if (!hot?.data) hot.data = { elements: LOCAL_ELEMENTS, delegates: DELEGATES };
  if (!hot?.data?.elements) hot.data.elements = LOCAL_ELEMENTS;
  if (!hot?.data?.delegates) hot.data.delegates = DELEGATES;
  const elements = hot?.data?.elements;
  const delegates = hot?.data?.delegates;

  const Host = tag in elements ? elements[tag] : class extends BaseHost {};
  Object.defineProperty(Host, 'name', {
    value: Controller.name,
    writable: false,
    enumerable: false,
    configurable: true,
  });
  Object.defineProperty(Host, 'Controller', { get: () => Controller, configurable: true });
  Object.defineProperty(Host, 'tagName', { get: () => tag, configurable: false });

  assertCustomElementName(tag);
  assertCustomElementConsistency(tag, Host as unknown as CustomElementConstructor, Controller);

  if (tag in elements && env.isDev) {
    deleteDelegates(Host, delegates.get(Host) ?? []);
    // todo: 개발 환경에서만 triggerHmrSwap<T>(HostClass)
  } else if (tag in elements) {
    throw new Error(`Custom element "${tag}" is already defined.`);
  }

  if (typeof customElements !== 'undefined' && !customElements.get(tag)) {
    customElements.define(tag, Host as unknown as CustomElementConstructor, options);
  }

  const definedMembers = definePrototypeDelegates<HostContext>(Host, Controller, (self) => self.controller);
  if (env.isDev) delegates.set(Host, [...definedMembers.methods, ...definedMembers.properties]);

  elements[tag] = Host;
  return Host;
}
