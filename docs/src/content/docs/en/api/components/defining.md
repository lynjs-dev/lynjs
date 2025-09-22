---
title: 커스텀 엘리먼트 정의하기
---

In LynJS, custom elements are defined by extending `LynElement`.

Once defined, the class is registered with the browser's **Custom Elements Registry** and works as a standard Web
Component.

This approach keeps components standard-compliant and makes them easily reusable across different projects.

---

## 문법 예시

```ts
import { LynElement, element } from '@lynjs/core';

export class MyElement extends LynElement {
  render() {
    const el = document.createElement('p');
    el.innerText = 'Hello from MyElement!';
    return el;
  }
}

customElements.define('my-element', MyElement);
```

- `LynElement` is the base class that provides lifecycle, rendering, and fine-grained reactivity features.
- `customElements.define` registers the class as a custom element in the browser.
