import { LynElement } from '@lynjs/core';

export class MyElement extends LynElement {
  render() {
    const el = document.createElement('p');
    el.innerText = 'Hello from MyElement!';
    return el;
  }
}

customElements.define('my-element', MyElement);
