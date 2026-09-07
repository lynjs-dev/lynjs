import { reactiveContext } from './reactive-context';
import type { EffectNode } from './reactive-effect';

export type Stop = () => void;
export type Connected = () => void | Disconnected;
export type Disconnected = () => void;

export class ReactiveScope {
  readonly children = new Set<ReactiveScope>();
  readonly parent: ReactiveScope | undefined;

  private readonly connectedCallbacks = new Set<Connected>();
  private readonly disconnectedCallbacks = new Set<Disconnected>();
  private readonly effects = new Set<EffectNode>();
  private readonly stops = new Set<Stop>();
  private stopped = false;

  isConnected = false;

  constructor(parent?: ReactiveScope) {
    this.parent = parent;
    parent?.children.add(this);
  }

  addConnected(callback: Connected): void {
    this.connectedCallbacks.add(callback);
  }

  addEffect(reactiveEffect: EffectNode): void {
    this.effects.add(reactiveEffect);
  }

  addStop(stop: Stop): void {
    this.stops.add(stop);
  }

  connect(): void {
    if (this.stopped || this.isConnected) return;

    this.isConnected = true;
    for (const callback of this.connectedCallbacks) {
      const cleanup = callback();
      if (cleanup) this.disconnectedCallbacks.add(cleanup);
    }
  }

  disconnect(): void {
    if (!this.isConnected) return;

    this.isConnected = false;
    for (const cleanup of this.disconnectedCallbacks) cleanup();
    this.disconnectedCallbacks.clear();
  }

  removeEffect(reactiveEffect: EffectNode): void {
    this.effects.delete(reactiveEffect);
  }

  removeStop(stop: Stop): void {
    this.stops.delete(stop);
  }

  run<T>(fn: () => T): T {
    if (this.stopped) throw new Error('Cannot run a stopped reactive scope');
    return reactiveContext.runWithScope(this, fn);
  }

  stop(): void {
    if (this.stopped) return;
    this.stopped = true;

    this.disconnect();
    for (const child of [...this.children]) child.stop();
    for (const reactiveEffect of [...this.effects]) reactiveEffect.dispose();
    for (const stop of [...this.stops]) stop();

    this.parent?.children.delete(this);
    this.children.clear();
    this.effects.clear();
    this.stops.clear();
  }
}

export function createScope(): ReactiveScope {
  return new ReactiveScope(reactiveContext.currentScope);
}

export function connected(callback: Connected): void {
  const scope = reactiveContext.currentScope;
  if (!scope) throw new Error('connected must be called within a reactive scope');
  scope.addConnected(callback);
}

export function root<T>(fn: (dispose: () => void) => T, owner?: ReactiveScope): T {
  const parent = owner instanceof ReactiveScope ? owner : reactiveContext.currentScope;
  const scope = new ReactiveScope(parent);

  try {
    const value = scope.run(() => fn(() => scope.stop()));
    scope.connect();
    return value;
  } catch (error) {
    scope.stop();
    throw error;
  }
}

export function getOwner(): ReactiveScope | undefined {
  return reactiveContext.currentScope;
}
