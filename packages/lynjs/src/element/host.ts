import type { ControllerContext, ControllerClass, HostContext, HostClass } from './types/element.d.ts';
import { DomHost as DomBaseHost } from './host/dom-host.ts';
import { SsrHost as SsrBaseHost } from './host/ssr-host.ts';
import type { JSX } from '../../types/jsx.d.ts';
import { env } from '../env.ts';
import IterableWeakSet from '../utils/iterable-weak-set.ts';
import { setControllerHost } from './controller.ts';

const kInstances = Symbol('lyn.instances');

function createBaseHostClass<T extends ControllerContext>(Base: HostClass): HostClass {
  class BaseHost extends Base implements HostContext {
    private static [kInstances] = new IterableWeakSet<HostContext>();

    #controller!: T;
    #connected = false;
    // #state = new Map<string | symbol, State>();

    constructor() {
      super();

      this.Class[kInstances].add(this);

      queueMicrotask(() => {
        this.mountController();
      });
    }

    public get Class(): typeof BaseHost {
      return this.constructor as unknown as typeof BaseHost;
    }

    public get Controller(): ControllerClass {
      return this.Class.Controller;
    }

    public get controller(): T {
      return this.#controller;
    }

    public get isConnected(): boolean {
      return this.#connected;
    }

    private mountController() {
      const controller = new this.Controller() as T;
      this.#controller = controller;
      setControllerHost(controller, this);
      this.render();
    }

    render(): JSX.Element {
      return super.render();
    }

    static __hmrSwap(): void {
      const instances = this[kInstances];

      for (const host of instances) {
        const controller = host.controller;
        try {
          controller?.disconnectedCallback?.();
        } catch (e) {
          console.error(e);
        }
        if (host.isConnected) {
          try {
            controller.connectedCallback?.();
          } catch (e) {
            console.error(e);
          }
        }
      }
    }

    connectedCallback(): void {
      this.#connected = true;
      this.#controller.connectedCallback?.();
    }

    disconnectedCallback(): void {
      this.#connected = false;
      this.#controller.disconnectedCallback?.();
    }

    adoptedCallback(): void {
      this.#controller.adoptedCallback?.();
    }

    attributeChangedCallback(name: string, oldVal: string | null, newVal: string | null): void {
      this.controller.attributeChangedCallback?.(name, oldVal, newVal);
    }
  }
  return BaseHost as unknown as HostClass;
}

function createDomHostClass<T extends ControllerContext>(): HostClass {
  const Base = createBaseHostClass<T>(DomBaseHost as unknown as HostClass);
  class DomHost extends Base implements HostContext {}
  return DomHost as unknown as HostClass;
}

function createSsrHostClass<T extends ControllerContext>(): HostClass {
  const Base = createBaseHostClass<T>(SsrBaseHost as unknown as HostClass);
  class SsrHost extends Base implements HostContext {}
  return SsrHost as unknown as HostClass;
}

const BaseHost = (() => {
  if (env.isBrowser) {
    return createDomHostClass();
  } else if (env.isNode) {
    return createSsrHostClass();
  } else {
    return createSsrHostClass();
  }
})();

export { BaseHost };
