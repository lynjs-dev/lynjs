import { JSX } from '../../types/jsx.js';
import type { ControllerClass, ControllerContext, HostContext } from './types/element.d.ts';
import type { Class } from '../../types/class.d.ts';
import { kBindHost, definePrototypeDelegates } from './utils/element.ts';

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class Controller implements ControllerContext {
  static readonly isShadow = true as const;

  #host!: HostContext | null;

  constructor() {
    this[kBindHost](null);
  }

  protected initialize() {}

  public get controller(): ControllerClass {
    return this;
  }

  public get host(): HostContext | null {
    return this.#host;
  }

  // One-time internal host binding.
  private [kBindHost](host: HostContext | null): void {
    if (this.#host) {
      throw new Error('Controller.host can only be assigned during controller creation.');
    }
    this.#host = host;
    if (host) this.initialize();
  }

  get isConnected(): boolean {
    return this.host?.isConnected ?? false;
  }

  instanceof(cls: Class): boolean {
    return this instanceof cls;
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

// Forward HTMLElement methods and accessors onto Controller instances via `host`.
definePrototypeDelegates<Controller>(Controller, HTMLElement, (self) => {
  return self.host;
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface Controller extends HTMLElement, ControllerClass {
  render(): JSX.Element;
}
