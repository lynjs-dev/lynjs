import type {
  ComponentController,
  ControllerClass,
  HostContext,
  HostClass,
  PersistedState,
  AttrPort,
  SchedulerPort,
  TimePort,
  EventPort,
} from '../types/component.js';
import { createState, State } from '../../state.ts';

interface ImportMetaHot {
  readonly data?: Record<string, unknown>;
  readonly accept: (cb?: (mod: unknown) => void) => void;
  readonly dispose: (cb: (data: Record<string, unknown>) => void) => void;
  readonly decline?: () => void;
  readonly invalidate?: () => void;
  readonly on?: (event: string, cb: (...args: unknown[]) => void) => void;
}

interface ImportMeta {
  readonly hot?: ImportMetaHot;
}

// ───────────────────────────────────────────────
// Host & Environment
// ───────────────────────────────────────────────

export type RuntimeEnvironment = 'dom' | 'ssr' | 'test';

// ───────────────────────────────────────────────
// State Policy (optional)
// ───────────────────────────────────────────────

export interface StatePolicy {
  allow?(key: string, value: unknown): boolean;
  denyKeys?: string[];
  enforcedAllowlist?: readonly string[];
}

// ───────────────────────────────────────────────
// Factory & Registration Options
// ───────────────────────────────────────────────

export interface HostFactoryOptions {
  env: RuntimeEnvironment;
  DomHost?: HostClass;
  SSRHost?: HostClass;
  TestHost?: HostClass;
  statePolicy?: StatePolicy;
  defaultNotify?: 'defer' | 'immediate' | 'silent';
}

export interface HostFactory {
  /** Create a concrete HostClass bound to the given Controller and env/options */
  resolve<T extends ComponentController = ComponentController>(
    Controller: ControllerClass<T>,
    options: HostFactoryOptions,
    tag: string,
  ): HostClass;
}

export interface DefineElementOptions extends HostFactoryOptions {
  /** Register in DOM env (default: true in DOM) */
  register?: boolean;
}

export type DefineElementFn = <T extends ComponentController = ComponentController>(
  tag: string,
  Controller: ControllerClass<T>,
  options?: DefineElementOptions,
) => HostClass;

// ───────────────────────────────────────────────
// Environment detection & default ports
// ───────────────────────────────────────────────

const isDomEnv = !!(window?.document && customElements);

const defaultDomScheduler: SchedulerPort | undefined = isDomEnv
  ? {
      queueMicrotask,
      setTimeout: window.setTimeout.bind(window),
      clearTimeout: window.clearTimeout.bind(window),
      requestAnimationFrame: window.requestAnimationFrame?.bind(window),
      cancelAnimationFrame: window.cancelAnimationFrame?.bind(window),
    }
  : undefined;

const defaultSsrScheduler: SchedulerPort = {
  queueMicrotask(cb) {
    return queueMicrotask(cb);
  },
  setTimeout,
  clearTimeout,
};

const defaultTimePort: TimePort = { now: () => Date.now() };

// ───────────────────────────────────────────────
// HMR registry (tag → instances) and trigger
// ───────────────────────────────────────────────
type HmrShadowSet = Set<HostContext>;
const hmrShadowRegistry: Map<string, HmrShadowSet> = new Map();

function hmrRegister(tag: string, host: HostContext): void {
  const shadow = hmrShadowRegistry.get(tag) ?? new Set<HostContext>();
  hmrShadowRegistry.set(tag, shadow);
  shadow.add(host);
}

function hmrUnregister(tag: string, host: HostContext): void {
  hmrShadowRegistry.get(tag)?.delete(host);
}

/** Public HMR trigger: swap all known instances of a tag */
export function triggerHmrSwap<T extends ComponentController = ComponentController>(
  tag: string,
  NewController: ControllerClass<T>,
): void {
  const shadow = hmrShadowRegistry.get(tag);
  if (!shadow || shadow.size === 0) return;
  for (const host of shadow) {
    (host as HostContext).__hmrSwap?.(NewController);
  }
}

// ───────────────────────────────────────────────
// Private slots
// ───────────────────────────────────────────────

const CONTROLLER: unique symbol = Symbol('controller');
const CONNECTED: unique symbol = Symbol('connected');
const ATTRIBUTES: unique symbol = Symbol('attributes');
const STATE: unique symbol = Symbol('state');

class SsrHostBase implements AttrPort, EventPort {
  // AttrPort
  private [ATTRIBUTES] = new Map<string, string>();

  getAttribute(name: string): string | null {
    return this[ATTRIBUTES].has(name) ? (this[ATTRIBUTES].get(name) as string) : null;
  }
  setAttribute(name: string, value: string): void {
    this[ATTRIBUTES].set(name, value);
  }
  removeAttribute(name: string): void {
    this[ATTRIBUTES].delete(name);
  }
  hasAttribute(name: string): boolean {
    return this[ATTRIBUTES].has(name);
  }

  // EventPort: no-op in SSR
  addEventListener(): void {}
  removeEventListener(): void {}
}

const DomHostBase = HTMLElement ?? undefined;

function createHostClass<T extends ComponentController>(
  Base: new () => AttrPort & EventPort,
  Controller: ControllerClass<T>,
  _opts: DefineElementOptions | undefined,
  tag: string,
): HostClass {
  class BaseHost extends Base implements HostContext {
    readonly scheduler = defaultDomScheduler;
    readonly time = defaultTimePort;

    protected [CONTROLLER]!: T;
    protected [CONNECTED] = false;
    protected [STATE]!: State;

    constructor() {
      super();
      this[STATE] = createState(this);
      this[CONTROLLER] = new Controller(this, this[STATE]);
    }

    __hmrSwap(NewController: ControllerClass<T>): void {
      const oldCtrl = this[CONTROLLER];

      try {
        oldCtrl?.disconnectedCallback?.();
      } catch {
        /* swallow */
      }

      this[CONTROLLER] = new NewController(this, this[STATE]);

      // if (this.isConnected) {
      //   try {
      //     next.connectedCallback?.();
      //   } finally {
      //     next.render();
      //   }
      // }
    }

    connectedCallback(): void {
      if (!this[CONTROLLER]) {
        this[CONTROLLER] = new Controller(this, this[STATE]);
      }
      // register the instance for HMR swaps
      hmrRegister(tag, this);
      this[CONNECTED] = true;
      this[CONTROLLER].connectedCallback?.();
      this[CONTROLLER].render();
    }

    disconnectedCallback(): void {
      // unregister from HMR registry
      hmrUnregister(tag, this);
      this[CONNECTED] = false;
      this[CONTROLLER]?.disconnectedCallback?.();
    }

    adoptedCallback(): void {
      this[CONTROLLER]?.adoptedCallback?.();
    }

    attributeChangedCallback(name: string, oldVal: string | null, newVal: string | null): void {
      this[CONTROLLER]?.attributeChangedCallback?.(name, oldVal, newVal);
    }
  }
  return BaseHost as unknown as HostClass;
}

// ───────────────────────────────────────────────
// Host class creators (DOM / SSR)
// ───────────────────────────────────────────────

function createDomHostClass<T extends ComponentController>(
  Controller: ControllerClass<T>,
  opts: DefineElementOptions | undefined,
  tag: string,
): HostClass {
  const Base = createHostClass<T>(
    (opts?.DomHost as unknown as CustomElementConstructor) ?? DomHostBase ?? HTMLElement,
    Controller,
    opts,
    tag,
  );

  class DomHost extends Base implements HostContext {
    readonly scheduler = defaultDomScheduler;
    readonly time = defaultTimePort;

    static get observedAttributes(): string[] {
      return (Controller.observedAttributes ?? []).slice();
    }
  }

  return DomHost as unknown as HostClass;
}

function createSsrHostClass<T extends ComponentController>(
  Controller: ControllerClass<T>,
  opts: DefineElementOptions | undefined,
  tag: string,
): HostClass {
  const Base = createHostClass<T>(SsrHostBase, Controller, opts, tag);

  class SsrHost extends Base implements HostContext {
    readonly scheduler = defaultSsrScheduler;
    readonly time = defaultTimePort;
  }

  return SsrHost as unknown as HostClass;
}

// ───────────────────────────────────────────────
// DefaultHostFactory: single entry to create HostClass
// ───────────────────────────────────────────────

class DefaultHostFactory implements HostFactory {
  resolve<T extends ComponentController>(
    Controller: ControllerClass<T>,
    options: HostFactoryOptions,
    tag: string,
  ): HostClass {
    const env: RuntimeEnvironment = options.env;

    if (env === 'dom') {
      // Create a concrete HTMLElement-based Host bound to Controller
      return createDomHostClass(Controller, options as DefineElementOptions, tag);
    }

    if (env === 'ssr') {
      // Create a concrete SSR Host bound to Controller (no HTMLElement)
      return createSsrHostClass(Controller, options as DefineElementOptions, tag);
    }

    // 'test' — default to SSR-like host unless a custom TestHost is provided later
    return createSsrHostClass(Controller, options as DefineElementOptions, tag);
  }
}

// ───────────────────────────────────────────────
// defineElement: public API
// - Create env-appropriate Host via factory
// - Register CustomElement in DOM env (opt-in/out)
// ───────────────────────────────────────────────

export const defineElement: DefineElementFn = (tag, Controller, options) => {
  const env: RuntimeEnvironment = options?.env ?? (isDomEnv ? 'dom' : 'ssr');

  type HotData = { hostCtors: Record<string, HostClass> };
  const hot = (import.meta as ImportMeta).hot as { data: HotData } | undefined;
  if (hot && !hot.data) hot.data = { hostCtors: {} };
  const hotData: HotData | undefined = hot?.data;

  if (hot) {
    if (env === 'dom' && isDomEnv) {
      const existing = customElements.get(tag) as unknown as HostClass | undefined;
      if (existing) {
        // Re-register not needed; swap all instances in place
        triggerHmrSwap(tag, Controller);
        return existing;
      }
    } else {
      const existing = hotData?.hostCtors?.[tag];
      if (existing) {
        triggerHmrSwap(tag, Controller);
        return existing;
      }
    }
  }

  const factory = new DefaultHostFactory();
  const HostCtor = factory.resolve(Controller, { ...(options ?? {}), env }, tag);

  if (env === 'dom' && isDomEnv && (options?.register ?? true)) {
    if (!customElements.get(tag)) {
      customElements.define(tag, HostCtor as unknown as CustomElementConstructor);
    }
  }

  if (hot && env !== 'dom') {
    hot.data.hostCtors[tag] = HostCtor;
  }

  return HostCtor;
};
