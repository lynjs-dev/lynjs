import type {
  ControllerContext,
  ControllerClass,
  HostContext,
  HostClass,
  AttrPort,
  EventPort,
} from './types/element.d.ts';
import { CONTROLLER, CONNECTED, STATE, HOST } from './symbol.ts';
import { state, State } from './../state.ts';
import { DomHost as DomHostBase } from './host/dom-host.ts';
import { SsrHost as SsrHostBase } from './host/ssr-host.ts';

export type RuntimeEnvironment = 'dom' | 'ssr' | 'test';

export interface StatePolicy {
  allow?(key: string, value: unknown): boolean;
  denyKeys?: string[];
  enforcedAllowlist?: readonly string[];
}

export interface HostFactoryOptions {
  env: RuntimeEnvironment;
  DomHost?: HostClass;
  SSRHost?: HostClass;
  TestHost?: HostClass;
  statePolicy?: StatePolicy;
  defaultNotify?: 'defer' | 'immediate' | 'silent';
}

export interface HostFactory {
  resolve<T extends ControllerContext = ControllerContext>(
    Controller: ControllerClass<T>,
    options: HostFactoryOptions,
    tag: string,
  ): HostClass;
}

export interface DefineElementOptions extends HostFactoryOptions, ElementDefinitionOptions {
  register?: boolean;
}

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

export function triggerHmrSwap<T extends ControllerClass = ControllerClass>(tag: string, NewController: T): void {
  const shadow = hmrShadowRegistry.get(tag);
  if (!shadow || shadow.size === 0) return;
  for (const host of shadow) {
    (host as HostContext).__hmrSwap?.(NewController);
  }
}

function createHostClass<T extends ControllerContext>(
  Base: new () => AttrPort & EventPort,
  Controller: ControllerClass<T>,
  _opts: DefineElementOptions | undefined,
  tag: string,
): HostClass {
  class BaseHost extends Base implements HostContext {
    [key: symbol]: unknown;

    private [CONTROLLER]!: T;
    private [CONNECTED] = false;
    private [STATE]!: State;

    constructor() {
      super();
      this[STATE] = state.get(this);
      this.createController(Controller);
    }

    public get controller(): T {
      return this[CONTROLLER];
    }

    public get isConnected(): boolean {
      return this[CONNECTED];
    }

    private createController(ActiveController: ControllerClass<T>): T {
      const controller = new ActiveController();
      (controller as Record<symbol, unknown>)[HOST] = this;
      this[CONTROLLER] = controller;
      return controller;
    }

    __hmrSwap(NewController: ControllerClass<T>): void {
      const oldCtrl = this[CONTROLLER];

      try {
        oldCtrl?.disconnectedCallback?.();
      } catch (e) {
        console.error(e);
      }

      const next = this.createController(NewController);

      if (next) {
        try {
          next.connectedCallback?.();
        } catch (e) {
          console.error(e);
        } finally {
          next.render();
        }
      }
    }

    connectedCallback(): void {
      hmrRegister(tag, this);
      this[CONNECTED] = true;
      this[CONTROLLER].connectedCallback?.();
      this[CONTROLLER].render();
    }

    disconnectedCallback(): void {
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

function createDomHostClass<T extends ControllerContext>(
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
    static get observedAttributes(): string[] {
      return (Controller.observedAttributes ?? []).slice();
    }
  }

  return DomHost as unknown as HostClass;
}

function createSsrHostClass<T extends ControllerContext>(
  Controller: ControllerClass<T>,
  opts: DefineElementOptions | undefined,
  tag: string,
): HostClass {
  const Base = createHostClass<T>(SsrHostBase, Controller, opts, tag);

  class SsrHost extends Base implements HostContext {}

  return SsrHost as unknown as HostClass;
}

export class DefaultHostFactory implements HostFactory {
  resolve<T extends ControllerContext>(
    Controller: ControllerClass<T>,
    options: HostFactoryOptions,
    tag: string,
  ): HostClass {
    const env: RuntimeEnvironment = options.env;

    if (env === 'dom') {
      return createDomHostClass(Controller, options as DefineElementOptions, tag);
    } else if (env === 'ssr') {
      return createSsrHostClass(Controller, options as DefineElementOptions, tag);
    } else {
      return createSsrHostClass(Controller, options as DefineElementOptions, tag);
    }
  }
}

export const hostFactory = new DefaultHostFactory();
