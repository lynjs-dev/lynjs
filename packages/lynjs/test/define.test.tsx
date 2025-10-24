import { describe, it, expect, beforeAll } from 'vitest';
import { LynElement } from 'lyn-element.ts';

describe('LynElement - define', () => {
  const tag = 'x-core-define-lyn-element';

  beforeAll(() => {
    class XTestEl extends LynElement {
      connectedCallback() {
        if (!this.shadowRoot) {
          this.attachShadow({ mode: 'open' });
        }
        const el = this.render() as Node;
        if (el) this.shadowRoot!.appendChild(el);
      }

      protected render() {
        return <div>Hello World</div>;
      }
    }

    if (!customElements.get(tag)) {
      customElements.define(tag, XTestEl);
    }
  });

  it('should create element via document.createElement and upgrade to LynElement', () => {
    const el = document.createElement(tag);
    expect(el).toBeInstanceOf(LynElement);
    expect(el).toBeInstanceOf(HTMLElement);
  });

  it('should render the content inside shadowRoot', () => {
    const el = document.createElement(tag) as LynElement;
    const div = el.shadowRoot?.querySelector('div');
    expect(div?.textContent).toBe('Hello World');
  });
});
