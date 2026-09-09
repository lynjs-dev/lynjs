import { reactiveContext } from './reactive-context';
import type { EffectNode } from './reactive-effect';

/**
 * 반응형 값을 보관하고 이 값을 읽은 Effect에 변경을 알린다.
 *
 * Effect 실행 중 `value`를 읽으면 Signal과 Effect가 서로 의존성을 기록한다. 값이 변경되면 이 Signal을
 * 구독한 Effect만 다시 실행하므로 전체 렌더링 없이 관련된 부분만 갱신할 수 있다.
 */
export class Signal<T> {
  private readonly subscribers = new Set<EffectNode>();

  constructor(private currentValue: T) {}

  /** 현재 값을 반환하고, Effect 안에서 읽었다면 해당 Effect를 구독자로 등록한다. */
  get value(): T {
    const reactiveEffect = reactiveContext.currentEffect;
    if (reactiveEffect && !reactiveEffect.disposed) {
      this.subscribe(reactiveEffect);
      reactiveEffect.addDependency(this as Signal<unknown>);
    }

    return this.currentValue;
  }

  /** 값이 실제로 변경된 경우에만 구독 중인 Effect에 변경을 알린다. */
  set value(nextValue: T) {
    if (Object.is(this.currentValue, nextValue)) return;

    this.currentValue = nextValue;
    // Effect 재실행 중 구독 목록이 변경될 수 있으므로 복사본을 순회한다.
    for (const reactiveEffect of [...this.subscribers]) reactiveEffect.run();
  }

  /** @internal Effect 실행 중 만들어지는 Signal → Effect 방향의 구독 관계를 등록한다. */
  subscribe(reactiveEffect: EffectNode): void {
    this.subscribers.add(reactiveEffect);
  }

  /** @internal Effect가 재실행, 일시 정지 또는 폐기될 때 구독 관계를 제거한다. */
  unsubscribe(reactiveEffect: EffectNode): void {
    this.subscribers.delete(reactiveEffect);
  }
}

/** 초기값을 가진 Signal을 생성한다. */
export function signal<T>(initialValue: T): Signal<T> {
  return new Signal(initialValue);
}
