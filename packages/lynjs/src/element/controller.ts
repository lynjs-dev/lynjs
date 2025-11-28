import { JSX } from '../../types/jsx.js';
import { HOST } from './symbol.ts';
import type { ControllerContext, HostContext } from './types/element.d.ts';

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class Controller implements ControllerContext {
  static readonly useShadow = true as const;

  private [HOST]!: HostContext;

  constructor() {}

  public get hostNode(): HostContext {
    return this[HOST];
  }

  public set hostNode(value: HostContext) {
    // Allow binding only once during createController()
    if (this[HOST] !== undefined) {
      throw new Error('Controller.hostNode can only be assigned during controller creation.');
    }
    this[HOST] = value;
  }

  get isConnected(): boolean {
    return this.hostNode.isConnected;
  }

  getAttribute(name: string) {
    return this.hostNode.getAttribute(name);
  }

  setAttribute(name: string, value: string): void {
    this.hostNode.setAttribute(name, value);
  }

  removeAttribute(name: string): void {
    this.hostNode.removeAttribute(name);
  }

  hasAttribute(name: string): boolean {
    return this.hostNode.hasAttribute(name);
  }

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    this.hostNode.addEventListener(type, listener, options);
  }

  dispatchEvent(event: Event): boolean {
    return this.hostNode.dispatchEvent(event);
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void {
    this.hostNode.removeEventListener(type, listener, options);
  }

  queueMicrotask(cb: () => void): void {
    queueMicrotask(cb);
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
      const node = this.hostNode;
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
      const host = this[HOST];
      return host[name];
    },
    set: function (value: unknown): void {
      const host = this[HOST];
      host[name] = value;
    },
    configurable: true,
  });
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface Controller extends HTMLElement, ControllerContext {
  render(): JSX.Element;
}
