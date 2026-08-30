import type { JSX as DOMExpressionsJSX } from 'dom-expressions/src/jsx';

declare global {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    type Element = Node;

    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface IntrinsicElements extends DOMExpressionsJSX.IntrinsicElements {}
  }
}

export {};
