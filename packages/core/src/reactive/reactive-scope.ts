import { reactiveContext } from './reactive-context';
import type { EffectNode } from './reactive-effect';

export type Stop = () => void;
export type Connected = () => void | Disconnected;
export type Disconnected = () => void;

/**
 * Effect와 생명주기 callback을 하나의 Owner 단위로 묶어 관리한다.
 *
 * `disconnect()`는 DOM에서 일시적으로 분리된 상태를 나타낸다. Effect의 Signal 구독을 해제하지만 Scope와
 * Effect는 보존하므로 `connect()`로 다시 사용할 수 있다. 반면 `stop()`은 Scope를 영구적으로 폐기한다.
 * LynElement는 인스턴스마다 Scope 하나를 만들고 연결과 해제 과정에서 재사용한다.
 */
export class ReactiveScope {
  /** 중첩된 root 또는 createScope로 만들어진 Scope의 소유권 트리다. */
  readonly children = new Set<ReactiveScope>();
  readonly parent: ReactiveScope | undefined;

  // connected callback이 반환한 정리 함수는 다음 disconnect까지 별도로 보관한다.
  private readonly connectedCallbacks = new Set<Connected>();
  private readonly disconnectedCallbacks = new Set<Disconnected>();

  // effects는 일시 정지와 재개가 가능하지만 stops는 Scope를 영구 폐기할 때 한 번만 실행한다.
  private readonly effects = new Set<EffectNode>();
  private readonly stops = new Set<Stop>();
  private stopped = false;

  isConnected = false;

  constructor(parent?: ReactiveScope) {
    this.parent = parent;
    // 부모가 정리될 때 자식도 함께 정리될 수 있도록 생성 즉시 소유권을 연결한다.
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

  /**
   * 일시 정지된 Scope를 연결 상태로 전환한다.
   *
   * Effect를 재실행하여 최신 Signal 값을 반영하고 의존성을 다시 수집한다. 재연결 중복 호출은 무시한다.
   */
  connect(): void {
    if (this.stopped || this.isConnected) return;

    this.isConnected = true;
    // 부모 Effect를 먼저 활성화한 뒤 자식 Scope와 외부 연결 callback을 순서대로 연결한다.
    for (const reactiveEffect of this.effects) reactiveEffect.resume();
    for (const child of this.children) child.connect();
    for (const callback of this.connectedCallbacks) {
      const cleanup = callback();
      if (cleanup) this.disconnectedCallbacks.add(cleanup);
    }
  }

  /**
   * Scope를 재사용할 수 있는 상태로 일시 정지한다.
   *
   * Effect의 cleanup과 Signal 구독은 해제하지만 Effect 객체, Scope 트리와 렌더링된 DOM은 제거하지 않는다.
   */
  disconnect(): void {
    if (!this.isConnected) return;

    this.isConnected = false;
    // 자식부터 분리하여 하위 반응성 작업이 부모보다 오래 활성화되는 것을 방지한다.
    for (const child of this.children) child.disconnect();
    for (const reactiveEffect of this.effects) reactiveEffect.pause();
    for (const cleanup of this.disconnectedCallbacks) cleanup();
    this.disconnectedCallbacks.clear();
  }

  removeEffect(reactiveEffect: EffectNode): void {
    this.effects.delete(reactiveEffect);
  }

  removeStop(stop: Stop): void {
    this.stops.delete(stop);
  }

  /** callback을 실행하는 동안 이 Scope를 getOwner()가 반환하는 현재 Owner로 설정한다. */
  run<T>(fn: () => T): T {
    if (this.stopped) throw new Error('Cannot run a stopped reactive scope');
    return reactiveContext.runWithScope(this, fn);
  }

  /**
   * Scope와 모든 하위 자원을 영구적으로 폐기한다.
   *
   * `disconnect()`와 달리 이후 다시 연결할 수 없다. 모든 자식 Scope와 Effect를 dispose하고 부모의 소유권
   * 목록에서도 자신을 제거한다. 여러 번 호출해도 첫 번째 호출만 처리한다.
   */
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

/** 현재 Scope가 연결될 때 실행할 callback과 선택적인 연결 해제 callback을 등록한다. */
export function connected(callback: Connected): void {
  const scope = reactiveContext.currentScope;
  if (!scope) throw new Error('connected must be called within a reactive scope');
  scope.addConnected(callback);
}

/** 현재 동기 실행 컨텍스트의 ReactiveScope를 반환한다. */
export function getOwner(): ReactiveScope | undefined {
  return reactiveContext.currentScope;
}

/**
 * dom-expressions가 렌더링 작업을 실행할 반응성 root를 제공한다.
 *
 * Owner를 전달하면 LynElement가 소유한 기존 Scope를 재사용한다. Owner가 없을 때만 새 Scope를 만들며,
 * callback에 전달되는 disposer는 해당 Scope를 `stop()`하여 영구적으로 정리한다.
 */
export function root<T>(fn: (dispose: () => void) => T, owner?: ReactiveScope): T {
  // LynElement 경로에서는 Scope를 중복 생성하지 않고 명시적으로 전달받은 Owner를 현재 Scope로 사용한다.
  if (owner) return owner.run(() => fn(() => owner.stop()));

  // 독립 root는 현재 Scope의 자식으로 만들어 부모가 정리될 때 함께 정리한다.
  const scope = new ReactiveScope(reactiveContext.currentScope);

  try {
    const value = scope.run(() => fn(() => scope.stop()));
    scope.connect();
    return value;
  } catch (error) {
    // callback이 실패해도 부분적으로 등록된 Effect나 자식 Scope를 남기지 않는다.
    scope.stop();
    throw error;
  }
}
