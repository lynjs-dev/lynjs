import { afterEach, describe, expect, it } from 'vitest';
import { LynElement, state } from '@lynjs/core';

class TestElement extends LynElement {
  @state private accessor message = 'hello LynElement';
  @state accessor count = 0;

  set text(value: string) {
    this.message = value;
  }

  protected render(): Node {
    return <span>{() => this.message}</span>;
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

  it('Signal이 변경되면 관련 DOM을 갱신한다', () => {
    const element = document.createElement(tagName) as TestElement;
    document.body.appendChild(element);

    element.text = 'hello reactive LynElement';

    expect(element.querySelector('span')?.textContent).toBe('hello reactive LynElement');
  });

  it('인스턴스와 프로퍼티별로 서로 다른 상태를 관리한다', () => {
    const first = document.createElement(tagName) as TestElement;
    const second = document.createElement(tagName) as TestElement;

    first.text = 'first';
    first.count = 1;
    second.count = 2;
    document.body.append(first, second);

    expect(first.count).toBe(1);
    expect(second.count).toBe(2);
    expect(first.textContent).toBe('first');
    expect(second.textContent).toBe('hello LynElement');
  });

  it('연결 해제 시 Effect 구독을 해제하고 재연결 시 Scope와 DOM을 재사용한다', () => {
    const element = document.createElement(tagName) as TestElement;
    document.body.appendChild(element);
    const renderedSpan = element.querySelector('span');

    element.remove();
    element.text = 'reconnected';

    expect(renderedSpan?.textContent).toBe('hello LynElement');

    document.body.appendChild(element);

    expect(element.querySelectorAll('span')).toHaveLength(1);
    expect(element.querySelector('span')).toBe(renderedSpan);
    expect(element.querySelector('span')?.textContent).toBe('reconnected');
  });
});
