import { afterEach, describe, expect, it } from 'vitest';
import { LynElement } from '@lynjs/core';

class TestElement extends LynElement {
  protected render(): Node {
    return <span>hello LynElement</span>;
  }
}

const tagName = 'lyn-test-element';

if (!customElements.get(tagName)) {
  customElements.define(tagName, TestElement);
}

describe('LynElement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('DOM에 연결되면 render 결과를 자식으로 추가한다', () => {
    const element = document.createElement(tagName);

    document.body.appendChild(element);

    expect(element).toBeInstanceOf(LynElement);
    expect(element.querySelector('span')?.textContent).toBe('hello LynElement');
  });
});
