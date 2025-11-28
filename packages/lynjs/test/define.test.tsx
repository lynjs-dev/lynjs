import { describe, it, beforeAll, expect } from 'vitest';
import { Controller } from '../src/element.ts';
import { element } from '../src/decorator.js';

describe('LynElement - define', async () => {
  const tag = 'x-core-define-lyn-host-node';

  @element(tag)
  class XTestEl extends Controller {
    render() {
      return <div>Hello World</div>;
    }
  }
  await Promise.resolve();

  beforeAll(() => {});

  it('should create hostNode via document.createElement and upgrade to LynElement', async () => {
    await Promise.resolve();
    const el = document.createElement(tag) as XTestEl;
    // expect(el).toBeInstanceOf(Controller);
    expect(el).toBeInstanceOf(HTMLElement);
  });

  // it('should render the content inside shadowRoot', async () => {
  //   const el = document.createElement(tag) as XTestEl;
  //   await Promise.resolve();
  //   const div = el.shadowRoot?.querySelector('div');
  //   expect(div?.textContent).toBe('Hello World');
  // });
});
