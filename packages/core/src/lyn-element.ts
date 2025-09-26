export class LynElement extends HTMLElement {
  /**
   * Component root policy: whether to use Shadow DOM.
   * If true, create and use an open shadow root.
   */
  static readonly useShadow = true as const;

  /** The root where this component renders. Uses shadowRoot if enabled, otherwise 'this'. */
  protected get hostNode(): ParentNode & Node {
    const Class = this.constructor as typeof LynElement;
    if (Class.useShadow) {
      // Create shadowRoot on first access if not already present
      return (this.shadowRoot ?? this.attachShadow({ mode: 'open' })) as unknown as ParentNode & Node;
    }
    return this as unknown as ParentNode & Node;
  }

  /**
   * Creates a new LynElement instance.
   * - Ensures a shadow root is created if `useShadow` is enabled.
   * - Immediately calls `render()` once and appends the returned Node
   *   to the element's hostNode (either shadowRoot or itself).
   */
  constructor() {
    super();
    // If useShadow is true, pre-create shadowRoot (ensures initial render target)
    if ((this.constructor as typeof LynElement).useShadow && !this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    const node = this.render();
    if (node) this.hostNode.appendChild(node);
  }

  /**
   * Subclasses override to return a Node.
   * Default returns an empty text node (kept as near no-op).
   */
  protected render(): Node {
    return document.createTextNode('');
  }
}
