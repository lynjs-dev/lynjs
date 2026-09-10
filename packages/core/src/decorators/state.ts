import { signal, type Signal } from '../reactive';

/** 인스턴스별로 프로퍼티 이름과 Signal의 대응 관계를 보관하는 공유 저장소다. */
const stateSignals = new WeakMap<object, Map<PropertyKey, Signal<unknown>>>();

function getInstanceSignals(instance: object): Map<PropertyKey, Signal<unknown>> {
  let signals = stateSignals.get(instance);
  if (!signals) {
    signals = new Map();
    stateSignals.set(instance, signals);
  }

  return signals;
}

function getStateSignal<Value>(instance: object, propertyName: PropertyKey): Signal<Value> {
  const stateSignal = stateSignals.get(instance)?.get(propertyName);
  if (!stateSignal) throw new Error(`State ${String(propertyName)} has not been initialized`);
  return stateSignal as Signal<Value>;
}

/**
 * Auto-accessor의 값을 인스턴스별 Signal로 관리한다.
 *
 * Effect 안에서 상태를 읽으면 의존성이 수집되고, 상태가 변경되면 그 상태를 읽은 Effect만 다시 실행된다.
 * 일반 필드가 아닌 `@state accessor value = initialValue` 형태로 사용해야 한다.
 */
export function state<This extends object, Value>(
  _target: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>,
): ClassAccessorDecoratorResult<This, Value> {
  const propertyName = context.name;

  return {
    init(initialValue) {
      getInstanceSignals(this).set(propertyName, signal(initialValue) as Signal<unknown>);
      return initialValue;
    },

    get() {
      return getStateSignal<Value>(this, propertyName).value;
    },

    set(nextValue) {
      getStateSignal<Value>(this, propertyName).value = nextValue;
    },
  };
}
