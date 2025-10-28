export * from 'dom-expressions/src/client.js';
import { insert, MountableElement } from 'dom-expressions/src/client.js';
import { JSX } from '../../types/jsx.js';
import { JSX as _JSX } from 'dom-expressions/src/jsx.js';
import { root } from '../reactive.ts';

export interface RenderOptions {
  owner?: unknown;
  clearOnDispose?: boolean;
  onDispose?: () => void;
}

/**
 * This function creates a reactive root via {@link root}, executes the given JSX-producing `code`,
 * and mounts its resulting DOM tree into the provided `element`. It returns a disposer function
 * that can be called later to clean up all reactive effects, signals, and resources created
 * during rendering.
 *
 * @param code - A function returning a JSX element (the component tree to render).
 * @param element - The target DOM node where the rendered content will be inserted.
 *                  Can be a standard Element, ShadowRoot, DocumentFragment, or Document.
 * @param init - (Optional) Initial JSX element or hydratable node list used for hydration.
 * @param options - (Optional) Rendering options.
 * @param options.owner - An existing reactive owner to attach this render tree to.
 *                        If omitted, a new root owner is created.
 * @param options.clearOnDispose - When `true`, clears the element’s text content after disposal.
 *                                 Defaults to `false`. This should generally be `false` for
 *                                 Custom Elements, since the browser manages their lifecycle.
 * @param options.onDispose - A callback executed immediately after the render tree has been disposed.
 *
 * @returns A disposer function. Calling it will:
 * - Tear down all reactive computations and effects created within this render root.
 * - Invoke `options.onDispose`, if provided.
 * - Optionally clear the element’s contents if `options.clearOnDispose` is `true`.
 *
 * @example
 * ```ts
 * import { render } from "@lynjs/dom";
 *
 * const dispose = render(() => <button>Hello</button>, document.getElementById("app")!);
 *
 * // Later, when you need to unmount:
 * dispose();
 * ```
 *
 * @example
 * ```ts
 * // Within a Custom Element
 * class MyEl extends HTMLElement {
 *   #dispose?: () => void;
 *   connectedCallback() {
 *     this.#dispose = render(() => <span>Hi!</span>, this.shadowRoot!);
 *   }
 *   disconnectedCallback() {
 *     this.#dispose?.(); // Reactive cleanup only — Shadow DOM is preserved
 *   }
 * }
 * customElements.define("my-el", MyEl);
 * ```
 */
export function render(
  code: () => JSX.Element,
  element: MountableElement,
  init?: JSX.Element,
  options: RenderOptions = {},
) {
  if (!element) {
    throw new Error(
      "The `element` passed to `render(..., element)` doesn't exist. Make sure `element` exists in the document.",
    );
  }

  const dispose = root(() => {
    if (element === document) code();
    else insert(element, code(), element.firstChild ? null : undefined, init as _JSX.Element);
  }, options.owner);

  return () => {
    dispose();
    options.onDispose?.();
    if (options.clearOnDispose && 'textContent' in element) (element as Element).textContent = '';
  };
}
