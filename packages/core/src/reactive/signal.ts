import { reactiveContext } from './reactive-context';
import type { EffectNode } from './reactive-effect';

export class Signal<T> {
  private readonly subscribers = new Set<EffectNode>();

  constructor(private currentValue: T) {}

  get value(): T {
    const reactiveEffect = reactiveContext.currentEffect;
    if (reactiveEffect && !reactiveEffect.disposed) {
      this.subscribe(reactiveEffect);
      reactiveEffect.addDependency(this as Signal<unknown>);
    }

    return this.currentValue;
  }

  set value(nextValue: T) {
    if (Object.is(this.currentValue, nextValue)) return;

    this.currentValue = nextValue;
    for (const reactiveEffect of [...this.subscribers]) reactiveEffect.run();
  }

  /** @internal */
  subscribe(reactiveEffect: EffectNode): void {
    this.subscribers.add(reactiveEffect);
  }

  /** @internal */
  unsubscribe(reactiveEffect: EffectNode): void {
    this.subscribers.delete(reactiveEffect);
  }
}

export function signal<T>(initialValue: T): Signal<T> {
  return new Signal(initialValue);
}
