export type Element = HTMLElement | SVGElement;

export class LynElement extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const child = this.render();
    this.appendChild(child);
  }

  protected render(): Node {
    throw new Error(`${this.constructor.name} must implement render()`);
  }
}

export default LynElement;
