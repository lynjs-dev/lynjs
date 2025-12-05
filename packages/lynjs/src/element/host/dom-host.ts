import type { ControllerClass, ControllerContext, HostContext } from '../types/element.d.ts';
import type { JSX } from '../../../types/jsx.d.ts';

export class DomHost extends HTMLElement implements HostContext {
  controller!: ControllerContext;

  __hmrSwap(_NewController: ControllerClass): void {
    throw new Error('Method not implemented.');
  }

  render(): JSX.Element {
    const controller = this.controller as unknown as ControllerContext;
    const Controller = controller.constructor as ControllerClass;
    const rootNode = Controller.isShadow ? this.attachShadow({ mode: 'open' }) : this;
    const child = controller.render();
    rootNode.append(child as Node);
    return rootNode;
  }
}
export default DomHost;
