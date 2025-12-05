import { JSX } from '../../types/jsx.js';
import type { ControllerClass, ControllerContext, HostContext } from './types/element.d.ts';

// Private symbol for host binding (not exported)
const kBindHost = Symbol('lyn.bindHost');

// Shouldn't be exposed outside lynjs
export function setControllerHost(controller: ControllerContext, host: HostContext): void {
  // Bind host via private symbol-only API; prevents external assignment.
  (controller as unknown as Record<symbol, (host: HostContext) => void>)[kBindHost](host);
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class Controller implements ControllerContext {
  static readonly isShadow = true as const;

  #host!: HostContext | null;

  constructor() {
    this[kBindHost](null);
  }

  public get controller(): ControllerClass {
    return this;
  }

  public get host(): HostContext | null {
    return this.#host;
  }

  // One-time internal host binding. Not accessible outside this module.
  private [kBindHost](value: HostContext | null): void {
    if (this.#host) {
      throw new Error('Controller.host can only be assigned during controller creation.');
    }
    this.#host = value;
  }

  get isConnected(): boolean {
    return this.host?.isConnected ?? false;
  }

  getAttribute(name: string): string | null {
    return this.host?.getAttribute(name) ?? null;
  }

  setAttribute(name: string, value: string): void {
    this.host?.setAttribute(name, value);
  }

  removeAttribute(name: string): void {
    this.host?.removeAttribute(name);
  }

  hasAttribute(name: string): boolean {
    return this.host?.hasAttribute(name) ?? false;
  }

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    this.host?.addEventListener(type, listener, options);
  }

  dispatchEvent(event: Event): boolean {
    return this.host?.dispatchEvent(event) ?? false;
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void {
    this?.host?.removeEventListener(type, listener, options);
  }

  queueMicrotask(callback: () => void): void {
    queueMicrotask(callback);
  }

  setInterval(handler: TimerHandler, timeout?: number, ...args: unknown[]): number {
    return setInterval(handler, timeout, ...args);
  }

  clearInterval(id: number): void {
    clearInterval(id);
  }

  setTimeout(handler: TimerHandler, timeout?: number, ...args: unknown[]): number {
    return setTimeout(handler, timeout, ...args);
  }

  clearTimeout(id: number): void {
    clearTimeout(id);
  }

  requestAnimationFrame(callback: FrameRequestCallback): number {
    if (requestAnimationFrame === undefined) return -1;
    return requestAnimationFrame(callback);
  }
  cancelAnimationFrame?(id: number): void {
    if (cancelAnimationFrame === undefined) return;
    cancelAnimationFrame(id);
  }

  render(): JSX.Element {
    return null;
  }
}

const hostProtos = [HTMLElement.prototype];

const methodNames = new Set<string>();
const propertyNames = new Set<string>();

for (const proto of hostProtos) {
  for (const key of Object.getOwnPropertyNames(proto)) {
    const desc = Object.getOwnPropertyDescriptor(proto, key);
    if (!desc) continue;

    if (typeof desc.value === 'function') {
      methodNames.add(key);
    } else {
      if (typeof desc.get === 'function' || typeof desc.set === 'function') {
        propertyNames.add(key);
      }
    }
  }
}

for (const name of methodNames) {
  if (name in Controller.prototype) continue;
  Object.defineProperty(Controller.prototype, name, {
    value: function (...args: unknown[]): unknown {
      const node = this.host;
      return node[name](...args);
    },
    writable: true,
    configurable: true,
  });
}

for (const name of propertyNames) {
  if (name in Controller.prototype) continue;

  Object.defineProperty(Controller.prototype, name, {
    get: function (): unknown {
      return this.host[name];
    },
    set: function (value: unknown): void {
      this.host[name] = value;
    },
    configurable: true,
  });
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface Controller extends HTMLElement, ControllerClass {
  render(): JSX.Element;
}
