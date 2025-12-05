import type { JSX } from '../../../types/jsx.d.ts';
import type { ControllerClass, ControllerContext, HostContext, HydrationPort } from '../types/element.d.ts';

export class SsrHost implements HostContext {
  #attributes = new Map<string, string>();

  hydrate?: HydrationPort | undefined;
  controller!: ControllerContext;
  isConnected!: boolean;

  __hmrSwap(_NewController: ControllerClass): void {
    throw new Error('Method not implemented.');
  }

  connectedCallback?(): void {
    throw new Error('Method not implemented.');
  }
  disconnectedCallback?(): void {
    throw new Error('Method not implemented.');
  }
  adoptedCallback?(): void {
    throw new Error('Method not implemented.');
  }
  attributeChangedCallback?(_name: string, _oldVal: string | null, _newVal: string | null): void {
    throw new Error('Method not implemented.');
  }

  getAttribute(name: string): string | null {
    return this.#attributes.has(name) ? (this.#attributes.get(name) as string) : null;
  }
  setAttribute(name: string, value: string): void {
    this.#attributes.set(name, value);
  }
  removeAttribute(name: string): void {
    this.#attributes.delete(name);
  }
  hasAttribute(name: string): boolean {
    return this.#attributes.has(name);
  }

  // EventPort: no-op in SSR
  addEventListener(
    _type: string,
    _listener: EventListenerOrEventListenerObject | null,
    _options?: AddEventListenerOptions | boolean,
  ): void {}

  dispatchEvent(_event: Event): boolean {
    return false;
  }

  removeEventListener(
    _type: string,
    _listener: EventListenerOrEventListenerObject | null,
    _options?: EventListenerOptions | boolean,
  ): void {}

  render(): JSX.Element {
    return null as unknown as JSX.Element;
  }
}

export default SsrHost;
