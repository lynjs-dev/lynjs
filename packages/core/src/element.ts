import { render as renderDOM } from './jsx-runtime';

export type Element = HTMLElement | SVGElement;

export class LynElement extends HTMLElement {
  private disposeRender?: () => void;

  constructor() {
    super();
  }

  connectedCallback() {
    if (this.disposeRender) return;
    const element = this.render();
    this.disposeRender = renderDOM(() => element, this);
  }

  disconnectedCallback() {
    this.disposeRender?.();
    this.disposeRender = undefined;
  }

  protected render(): Node {
    throw new Error(`${this.constructor.name} must implement render()`);
  }
}

export default LynElement;
