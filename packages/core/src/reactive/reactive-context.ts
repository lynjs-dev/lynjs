import type { EffectNode, ReactiveEffect } from './reactive-effect';
import type { ReactiveScope } from './reactive-scope';

class ReactiveContext {
  readonly effectStack: EffectNode[] = [];
  readonly scopeStack: ReactiveScope[] = [];

  get currentEffect(): EffectNode | undefined {
    return this.effectStack.at(-1);
  }

  get currentScope(): ReactiveScope | undefined {
    return this.scopeStack.at(-1);
  }

  runWithEffect<T>(reactiveEffect: ReactiveEffect<T>, fn: () => T): T {
    this.effectStack.push(reactiveEffect);
    try {
      return fn();
    } finally {
      this.effectStack.pop();
    }
  }

  runWithScope<T>(scope: ReactiveScope, fn: () => T): T {
    this.scopeStack.push(scope);
    try {
      return fn();
    } finally {
      this.scopeStack.pop();
    }
  }

  runUntracked<T>(fn: () => T): T {
    const reactiveEffect = this.effectStack.pop();
    try {
      return fn();
    } finally {
      if (reactiveEffect) this.effectStack.push(reactiveEffect);
    }
  }
}

export const reactiveContext = new ReactiveContext();
