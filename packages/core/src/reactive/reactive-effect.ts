import { reactiveContext } from './reactive-context';
import type { ReactiveScope } from './reactive-scope';
import type { Signal } from './signal';

export type Cleanup = () => void;

export interface EffectNode {
  readonly cleanups: Set<Cleanup>;
  readonly dependencies: Set<Signal<unknown>>;
  readonly disposed: boolean;
  addDependency(source: Signal<unknown>): void;
  dispose(): void;
  run(): unknown;
}

export class ReactiveEffect<T = unknown> implements EffectNode {
  readonly cleanups = new Set<Cleanup>();
  readonly dependencies = new Set<Signal<unknown>>();
  readonly scope: ReactiveScope | undefined;

  disposed = false;
  private previous: T | undefined;
  private running = false;

  constructor(
    private readonly fn: (previous?: T) => T,
    initial?: T,
  ) {
    this.previous = initial;
    this.scope = reactiveContext.currentScope;
    this.scope?.addEffect(this);
  }

  /** @internal */
  addDependency(source: Signal<unknown>): void {
    this.dependencies.add(source);
  }

  dispose(): void {
    if (this.disposed) return;

    this.disposed = true;
    this.cleanup();
    this.scope?.removeEffect(this);
  }

  run(): T {
    if (this.disposed || this.running) return this.previous as T;

    this.cleanup();
    this.running = true;
    try {
      this.previous = reactiveContext.runWithEffect(this, () => this.fn(this.previous));
      return this.previous;
    } finally {
      this.running = false;
    }
  }

  private cleanup(): void {
    for (const cleanup of this.cleanups) cleanup();
    this.cleanups.clear();

    for (const source of this.dependencies) source.unsubscribe(this);
    this.dependencies.clear();
  }
}

export function createEffect<T>(fn: (previous?: T) => T, initial?: T): () => void {
  const reactiveEffect = new ReactiveEffect(fn, initial);
  reactiveEffect.run();
  return () => reactiveEffect.dispose();
}

export function effect<T>(fn: (previous?: T) => T, initial?: T): T {
  return new ReactiveEffect(fn, initial).run();
}

export function onCleanup(cleanup: Cleanup): void {
  const reactiveEffect = reactiveContext.currentEffect;
  if (!reactiveEffect) throw new Error('onCleanup must be called within an effect');
  reactiveEffect.cleanups.add(cleanup);
}
