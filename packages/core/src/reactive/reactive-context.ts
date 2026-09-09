import type { EffectNode, ReactiveEffect } from './reactive-effect';
import type { ReactiveScope } from './reactive-scope';

/**
 * 현재 동기 실행 구간의 ReactiveEffect와 ReactiveScope를 추적한다.
 *
 * Signal은 `currentEffect`를 확인하여 자신을 읽고 있는 Effect를 구독자로 등록하고, Effect는
 * `currentScope`를 확인하여 자신의 생명주기를 관리할 Owner를 결정한다. Effect와 Scope가 서로 중첩될 수
 * 있으므로 단일 변수 대신 스택을 사용한다.
 *
 * 이 컨텍스트는 동기 실행만 추적한다. `await` 이후에는 실행 컨텍스트가 유지되지 않는다.
 */
class ReactiveContext {
  /** 가장 마지막 항목이 현재 Signal 의존성을 수집 중인 Effect다. */
  readonly effectStack: EffectNode[] = [];

  /** 가장 마지막 항목이 새 Effect와 자식 Scope를 소유할 현재 Scope다. */
  readonly scopeStack: ReactiveScope[] = [];

  /** Signal getter가 구독 대상으로 사용할 현재 Effect를 반환한다. */
  get currentEffect(): EffectNode | undefined {
    return this.effectStack.at(-1);
  }

  /** Effect 생성과 getOwner()에서 사용할 현재 Scope를 반환한다. */
  get currentScope(): ReactiveScope | undefined {
    return this.scopeStack.at(-1);
  }

  /**
   * callback 실행 중에만 지정한 Effect를 현재 Effect로 설정한다.
   *
   * 중첩 Effect 실행이 끝나면 이전 Effect가 다시 현재 Effect가 된다. callback이 오류를 던져도 `finally`에서
   * 스택을 복원하므로 이후 의존성 수집이 오염되지 않는다.
   */
  runWithEffect<T>(reactiveEffect: ReactiveEffect<T>, fn: () => T): T {
    this.effectStack.push(reactiveEffect);
    try {
      return fn();
    } finally {
      this.effectStack.pop();
    }
  }

  /**
   * callback 실행 중에만 지정한 Scope를 현재 Owner로 설정한다.
   *
   * 이 구간에서 생성되는 Effect는 해당 Scope에 등록되고, Owner 없이 생성되는 Scope는 해당 Scope의 자식이
   * 된다. 실행이 끝나면 이전 Owner를 복원한다.
   */
  runWithScope<T>(scope: ReactiveScope, fn: () => T): T {
    this.scopeStack.push(scope);
    try {
      return fn();
    } finally {
      this.scopeStack.pop();
    }
  }

  /**
   * callback 안에서 읽은 Signal이 바깥 Effect의 의존성으로 등록되지 않게 한다.
   *
   * 현재 Effect를 잠시 스택에서 제거하고 callback이 끝나면 같은 위치로 복원한다. callback 안에서 새로운
   * Effect를 실행하더라도 그 Effect는 자체 실행 구간에서 정상적으로 의존성을 수집한다.
   */
  runUntracked<T>(fn: () => T): T {
    const reactiveEffect = this.effectStack.pop();
    try {
      return fn();
    } finally {
      if (reactiveEffect) this.effectStack.push(reactiveEffect);
    }
  }
}

/** reactive 런타임 전체가 공유하는 유일한 동기 실행 컨텍스트다. */
export const reactiveContext = new ReactiveContext();
