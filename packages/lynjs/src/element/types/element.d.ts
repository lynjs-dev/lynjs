import type { JSX } from '../../../types/jsx.d.ts';
import type { Class } from '../../../types/class.d.ts';

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

export interface HostContext extends ElementLifecycle, AttrPort, EventTarget, RenderPort {
  readonly hydrate?: HydrationPort;
  readonly controller: ControllerContext;
  instanceof(ControllerClass: Class): boolean;
  __hmrSwap(NewController: ControllerClass): void;
}

export interface HostClassStatic {
  readonly tagName: string;
  readonly Controller: ControllerClass;
}

export type HostClass<T extends HostContext = HostContext> = (new () => T) & HostClassStatic;

// ControllerContext 의 render 는 Host에서만 호출되어야 한다.
export interface ControllerContext extends ElementLifecycle, AttrPort, EventTarget, SchedulerPort, RenderPort {
  readonly host: HostContext | null;
  instanceof(ControllerClass: Class): boolean;
}

export interface ControllerClassStatic {
  readonly isShadow: boolean;
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

export type ControllerClass<T extends ControllerContext = ControllerContext> = (new () => T) &
  Partial<ControllerClassStatic>;
