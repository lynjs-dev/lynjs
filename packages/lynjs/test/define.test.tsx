import { describe, it, expect, beforeAll } from 'vitest';
import { LynElement } from '../src/element.ts';
import { element } from '../src/decorator.js';

describe('LynElement - define', async () => {
  const tag = 'x-core-define-lyn-element';

  @element(tag)
  class XTestEl extends LynElement {
    protected render() {
      return <div>Hello World</div>;
    }
  }
  await Promise.resolve();

  beforeAll(() => {});

  it('should create element via document.createElement and upgrade to LynElement', async () => {
    const el = document.createElement(tag);
    expect(el).toBeInstanceOf(LynElement);
    expect(el).toBeInstanceOf(HTMLElement);
  });

  it('should render the content inside shadowRoot', async () => {
    const el = document.createElement(tag) as XTestEl;
    await Promise.resolve();
    const div = el.shadowRoot?.querySelector('div');
    expect(div?.textContent).toBe('Hello World');
  });
});
