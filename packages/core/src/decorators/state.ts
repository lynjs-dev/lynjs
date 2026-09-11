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
 * 클래스 필드를 인스턴스별 Signal에 연결된 반응형 프로퍼티로 변환한다.
 *
 * 필드가 초기화된 직후 기존 own data property를 own accessor로 교체한다. 이후 값을 읽으면 실행 중인 Effect의
 * 의존성이 수집되고, 값을 변경하면 해당 Signal을 구독하는 Effect만 다시 실행된다.
 */
export function state<This extends object, Value>(
  _target: undefined,
  context: ClassFieldDecoratorContext<This, Value>,
): void {
  if (context.private) throw new TypeError('@state does not support private fields declared with #');

  const propertyName = context.name;

  // Field용 extra initializer는 해당 필드가 own property로 정의된 직후 인스턴스마다 한 번 실행된다.
  context.addInitializer(function () {
    // 원래 필드를 accessor로 교체하기 전에 사용자가 선언한 초기값을 Signal로 옮긴다.
    const initialValue = context.access.get(this);
    getInstanceSignals(this).set(propertyName, signal(initialValue) as Signal<unknown>);

    // Prototype이 아닌 인스턴스의 필드를 교체하여 최신 class field의 own property에 가려지지 않게 한다.
    Object.defineProperty(this, propertyName, {
      configurable: true,
      enumerable: true,

      get: () => getStateSignal<Value>(this, propertyName).value,

      set: (nextValue: Value) => {
        getStateSignal<Value>(this, propertyName).value = nextValue;
      },
    });
  });
}
