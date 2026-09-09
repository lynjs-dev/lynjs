import { reactiveContext } from './reactive-context';
import type { ReactiveScope } from './reactive-scope';
import type { Signal } from './signal';

export type Cleanup = () => void;

/** Signal과 ReactiveScope가 Effect를 제어하기 위해 사용하는 내부 계약이다. */
export interface EffectNode {
  readonly cleanups: Set<Cleanup>;
  readonly dependencies: Set<Signal<unknown>>;
  readonly disposed: boolean;
  addDependency(source: Signal<unknown>): void;
  dispose(): void;
  pause(): void;
  resume(): void;
  run(): unknown;
}

/**
 * 실행 중 읽은 Signal을 의존성으로 수집하고 값이 변경되면 callback을 다시 실행한다.
 *
 * 재실행할 때마다 이전 의존성과 cleanup을 제거한 뒤 새로 수집한다. `pause()`는 재연결을 위해 Effect를
 * 보존하지만 `dispose()`는 Scope에서도 제거하여 영구적으로 폐기한다.
 */
export class ReactiveEffect<T = unknown> implements EffectNode {
  readonly cleanups = new Set<Cleanup>();
  readonly dependencies = new Set<Signal<unknown>>();
  readonly scope: ReactiveScope | undefined;

  disposed = false;
  private paused = false;
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

  /** Signal 구독과 cleanup을 해제하되 재사용할 수 있도록 Effect 자체는 보존한다. */
  pause(): void {
    if (this.disposed || this.paused) return;

    this.paused = true;
    this.cleanup();
  }

  /** 일시 정지된 Effect를 실행하여 최신 값을 반영하고 Signal 의존성을 다시 수집한다. */
  resume(): void {
    if (this.disposed || !this.paused) return;

    this.paused = false;
    this.run();
  }

  /** callback의 반환값을 보관하고 다음 실행의 `previous` 인자로 전달한다. */
  run(): T {
    // 같은 Effect가 실행 중 자신을 다시 호출하는 순환 재진입을 막는다.
    if (this.disposed || this.paused || this.running) return this.previous as T;

    this.cleanup();
    this.running = true;
    try {
      this.previous = reactiveContext.runWithEffect(this, () => this.fn(this.previous));
      return this.previous;
    } finally {
      this.running = false;
    }
  }

  /** 다음 실행이나 정지 전에 외부 자원과 Signal의 양방향 구독 관계를 정리한다. */
  private cleanup(): void {
    for (const cleanup of this.cleanups) cleanup();
    this.cleanups.clear();

    for (const source of this.dependencies) source.unsubscribe(this);
    this.dependencies.clear();
  }
}

/** Effect를 즉시 실행하고 독립적으로 영구 정리할 수 있는 disposer를 반환한다. */
export function createEffect<T>(fn: (previous?: T) => T, initial?: T): () => void {
  const reactiveEffect = new ReactiveEffect(fn, initial);
  reactiveEffect.run();
  return () => reactiveEffect.dispose();
}

/** dom-expressions 호환 API로, Effect를 즉시 실행하고 최초 실행 결과를 반환한다. */
export function effect<T>(fn: (previous?: T) => T, initial?: T): T {
  return new ReactiveEffect(fn, initial).run();
}

/** 현재 실행 중인 Effect가 재실행되거나 정리되기 전에 호출할 cleanup을 등록한다. */
export function onCleanup(cleanup: Cleanup): void {
  const reactiveEffect = reactiveContext.currentEffect;
  if (!reactiveEffect) throw new Error('onCleanup must be called within an effect');
  reactiveEffect.cleanups.add(cleanup);
}
