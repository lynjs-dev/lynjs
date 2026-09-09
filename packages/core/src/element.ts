import { render as renderDOM } from './jsx-runtime';
import { ReactiveScope } from './reactive';

export type Element = HTMLElement | SVGElement;

export class LynElement extends HTMLElement {
  private readonly reactiveScope = new ReactiveScope();
  private rendered = false;

  constructor() {
    super();
  }

  connectedCallback() {
    this.reactiveScope.connect();
    if (this.rendered) return;

    const owner = this.reactiveScope;

    try {
      renderDOM(() => this.render(), this, undefined, { owner });
      this.rendered = true;
    } catch (error) {
      owner.disconnect();
      throw error;
    }
  }

  disconnectedCallback() {
    this.reactiveScope.disconnect();
  }

  protected render(): Node {
    throw new Error(`${this.constructor.name} must implement render()`);
  }
}

export default LynElement;
