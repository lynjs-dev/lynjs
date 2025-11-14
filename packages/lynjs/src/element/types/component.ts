// ───────────────────────────────────────────────
// Core: State & Lifecycle
// ───────────────────────────────────────────────

import type { JSX } from '../../../types/jsx.d.ts';
import { State } from '../../state.ts';

export type PersistedState = Record<string | symbol, unknown>;

export interface ComponentLifecycle {
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  adoptedCallback?(): void;
  // NOTE: persistedState MUST NOT live here.
}

// ───────────────────────────────────────────────
// Ports: Platform capabilities (unchanged)
// (SchedulerPort, TimePort, AttrPort, EventPort, RenderPort, HydrationPort)
// ───────────────────────────────────────────────

export interface SchedulerPort {
  queueMicrotask(cb: () => void): void;
  setTimeout(cb: () => void, ms: number): number;
  clearTimeout(id: number): void;
  requestAnimationFrame?(cb: (t: number) => void): number;
  cancelAnimationFrame?(id: number): void;
}

export interface TimePort {
  now(): number;
}

export interface AttrPort {
  getAttribute(name: string): string | null;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  hasAttribute(name: string): boolean;
}

export interface EventPort {
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
}

/** Rendering abstraction: DOM patch (browser) or string/chunk (SSR) */
export interface RenderPort {
  mount?(host: unknown): void;
  patch?(op: unknown): void;
  unmount?(): void;
}

/** Minimal enhancement channel for hydration (optional) */
export interface HydrationPort {
  readEnhancement?(host: unknown): PersistedState | undefined;
  writeEnhancement?(host: unknown, state: PersistedState): void;
}

// ───────────────────────────────────────────────
// Host surface exposed to Controllers
// ───────────────────────────────────────────────

export interface HostContext extends ComponentLifecycle, AttrPort, EventPort {
  readonly scheduler?: SchedulerPort;
  readonly time?: TimePort;
  readonly render?: RenderPort;
  readonly hydrate?: HydrationPort;

  /** HMR protocol (call order specified in docs) */
  __hmrSwap?(NewController: ControllerClass): void;
}

// ───────────────────────────────────────────────
// Controller contract (persistedState here)
// ───────────────────────────────────────────────

export interface ComponentController extends ComponentLifecycle {
  /** Attribute change forwarding from Host */
  attributeChangedCallback?(name: string, oldVal: string | null, newVal: string | null): void;

  /** Render trigger: DOM patch or SSR buffer/chunk */
  render(): JSX.Element;
}

/** Static hints for Host/framework */
export interface ControllerClassStatic {
  observedAttributes?: string[];
  stateVersion?: number;
  /** Allowlist of property names permitted in persistedState */
  persistedKeys?: readonly string[];
}

export type ControllerClass<T extends ComponentController = ComponentController> = (new (
  host: HostContext,
  state: State,
) => T) &
  Partial<ControllerClassStatic>;

// Optional hooks (unchanged)
export interface HmrRestorable {
  onHmrRestore?(state: PersistedState): void;
}

export interface HydrationOrder {
  restoreFromAttributes(): void;
  restoreFromEnhancement?(): void;
  connectAndRender(): void;
}

export type HostClass<T extends HostContext = HostContext> = new () => T;
