import { describe, it, expect, beforeAll } from 'vitest';
import { LynElement } from 'lyn-element.ts';
import { createSignal } from '../src/reactive.js';

describe('LynElement - define', () => {
  const tag = 'x-core-define-lyn-element';
  class XTestEl extends LynElement {
    public content = createSignal('Hello World');

    protected render() {
      return <div>{this.content.get}</div>;
    }
  }

  if (!customElements.get(tag)) {
    customElements.define(tag, XTestEl);
  }

  beforeAll(() => {});

  it('should create element via document.createElement and upgrade to LynElement', () => {
    const el = document.createElement(tag);
    expect(el).toBeInstanceOf(LynElement);
    expect(el).toBeInstanceOf(HTMLElement);
  });

  it('should render the content inside shadowRoot', async () => {
    const el = document.createElement(tag) as XTestEl;

    await Promise.resolve();

    const div = el.shadowRoot?.querySelector('div');
    expect(div?.textContent).toBe('Hello World');
    el.content.set('Hello LynJS');
    expect(div?.textContent).toBe('Hello LynJS');
  });
});
