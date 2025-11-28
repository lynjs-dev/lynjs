import type { JSX } from '../../../types/jsx.d.ts';

export type PersistedState = Record<string | symbol, unknown>;

export interface ElementLifecycle {
  readonly isConnected: boolean;
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  adoptedCallback?(): void;
}

export interface AttrPort {
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  hasAttribute(name: string): boolean;
  attributeChangedCallback?(name: string, oldVal: string | null, newVal: string | null): void;
}

export interface EventPort {
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean,
  ): void;
  dispatchEvent(event: Event): boolean;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void;
}

export interface SchedulerPort {
  queueMicrotask(cb: () => void): void;
  setInterval(handler: TimerHandler, timeout?: number, ...args: unknown[]): number;
  clearInterval(id: number): void;
  setTimeout(handler: TimerHandler, timeout?: number, ...args: unknown[]): number;
  clearTimeout(id: number): void;
  requestAnimationFrame?(callback: FrameRequestCallback): number;
  cancelAnimationFrame?(id: number): void;
}

export interface RenderPort {
  render(): JSX.Element;
}

export interface HydrationPort {
  readEnhancement?(host: unknown): PersistedState | undefined;
  writeEnhancement?(host: unknown, state: PersistedState): void;
}

export interface HostContext extends ElementLifecycle, AttrPort, EventTarget {
  readonly hydrate?: HydrationPort;
  render?: RenderPort;
  controller: ControllerContext;

  __hmrSwap?(NewController: ControllerClass): void;
}

export interface ControllerContext extends ElementLifecycle, AttrPort, EventTarget, SchedulerPort, RenderPort {
  hostNode: HostContext;
}

export interface ControllerClassStatic {
  observedAttributes?: string[];
  stateVersion?: number;
  persistedKeys?: readonly string[];
}

export interface HmrRestorable {
  onHmrRestore?(state: PersistedState): void;
}

export interface HydrationOrder {
  restoreFromAttributes(): void;
  restoreFromEnhancement?(): void;
  connectAndRender(): void;
}

export type HostClass<T extends HostContext = HostContext> = new () => T;

export type ControllerClass<T extends ControllerContext = ControllerContext> = (new () => T) &
  Partial<ControllerClassStatic>;
