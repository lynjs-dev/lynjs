import type { AttrPort, EventPort } from '../types/element.d.ts';
import { ATTRIBUTES } from '../symbol.ts';

export class SsrHost implements AttrPort, EventPort {
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
}

export default SsrHost;
