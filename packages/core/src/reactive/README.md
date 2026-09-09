# LynJS Reactive

LynJS의 fine-grained reactivity를 담당하는 내부 런타임이다. Signal을 읽은 Effect만 의존성으로 연결하고,
Signal의 값이 변경되면 관련 Effect만 다시 실행한다. ReactiveScope는 Effect와 정리 작업의 수명을 관리한다.

현재 `dom-expressions`가 요구하는 반응성 API를 제공하며, 외부에서는 다음 경로를 통해 사용한다.

```ts
import { createEffect, effect, root, signal } from '@lynjs/core/rxcore';
```

## 모듈 구조

```text
reactive/
├── index.ts              # dom-expressions 호환 API와 공개 진입점
├── signal.ts             # Signal 값과 구독자 관리
├── reactive-effect.ts    # Effect 실행, 의존성 및 cleanup 관리
├── reactive-context.ts   # 현재 Effect와 Scope 실행 컨텍스트
├── reactive-scope.ts     # Owner 계층과 생명주기 관리
└── README.md             # 설계, 사용법과 현재 제한 사항
```

## 실행 흐름

```text
root(owner 없음)
└── ReactiveScope 생성 및 연결
    └── callback 실행

root(owner 전달)
└── 기존 ReactiveScope 재사용
    └── callback 실행

effect 실행
└── Signal.value 읽기
    └── Signal과 Effect 의존성 연결

Signal.value 변경
└── Object.is()로 값 변경 확인
    └── 해당 Signal을 구독한 Effect만 재실행
        ├── 이전 cleanup 실행
        ├── 이전 Signal 구독 해제
        └── 새 의존성 수집

ReactiveScope.disconnect()
└── Effect 일시 정지
    ├── cleanup 실행
    └── Signal 구독 해제

ReactiveScope.connect()
└── 정지된 Effect 재실행
    └── 최신 값 반영 및 Signal 재구독

root disposer 실행
└── ReactiveScope.stop()
    ├── 자식 Scope 정리
    ├── Effect 정리
    ├── Signal 구독 해제
    └── 연결 해제 callback 실행
```

## Signal

`signal()`은 반응형 값을 저장하는 `Signal<T>`를 생성한다.

```ts
const count = signal(0);

console.log(count.value);
count.value = 1;
```

Effect가 실행되는 동안 `value`를 읽으면 Signal이 현재 Effect를 구독자로 등록한다.
`Object.is()` 기준으로 이전 값과 새 값이 같으면 구독자에게 변경을 알리지 않는다.

```ts
const count = signal(0);

effect(() => {
  console.log(count.value);
});

count.value = 1; // Effect 재실행
count.value = 1; // 같은 값이므로 재실행하지 않음
```

Signal과 Effect는 구독 관계를 양쪽에 기록한다. Signal은 값 변경 시 실행할 Effect를 찾기 위해 구독자를
보관하고, Effect는 재실행이나 연결 해제 시 자신을 제거할 Signal 목록을 보관한다.

## ReactiveEffect

`ReactiveEffect`는 반응형 함수를 실행하고 다음 정보를 관리한다.

- 실행 중 읽은 Signal 목록
- `onCleanup()`으로 등록한 정리 함수
- 소속 ReactiveScope
- 이전 실행의 반환값
- 실행, pause 및 dispose 상태

Effect를 다시 실행하기 전에 이전 cleanup과 Signal 구독을 제거하고 의존성을 새로 수집한다.
따라서 조건에 따라 읽는 Signal이 바뀌어도 더 이상 사용하지 않는 Signal에는 구독이 남지 않는다.

```ts
const enabled = signal(true);
const first = signal('first');
const second = signal('second');

createEffect(() => {
  console.log(enabled.value ? first.value : second.value);
});
```

`enabled.value`가 `false`로 변경되면 Effect는 `first`의 구독을 제거하고 `second`를 구독한다.

### createEffect

Effect를 즉시 한 번 실행하고 독립적으로 정리할 수 있는 disposer를 반환한다.

```ts
const count = signal(0);

const dispose = createEffect(() => {
  console.log(count.value);
});

count.value = 1;
dispose();
count.value = 2; // 정리된 Effect는 실행되지 않음
```

### effect

`dom-expressions` 호환 함수다. Effect를 즉시 실행하고 최초 실행 결과를 반환한다.
생성된 Effect를 안전하게 정리하려면 `root()`가 만든 ReactiveScope 안에서 사용해야 한다.

```ts
const count = signal(0);

root((dispose) => {
  effect(() => count.value);

  // 더 이상 필요하지 않을 때 호출한다.
  dispose();
});
```

Effect 함수의 반환값은 다음 실행의 `previous` 인자로 전달된다.

```ts
const count = signal(1);

effect((previous) => {
  const current = count.value;
  console.log({ previous, current });
  return current;
});
```

## Cleanup

`onCleanup()`은 현재 실행 중인 Effect에 정리 함수를 등록한다.
정리 함수는 Effect가 다시 실행되기 전, 일시 정지될 때와 Effect가 dispose될 때 실행된다.

```ts
const interval = signal(1000);

createEffect(() => {
  const timer = setInterval(() => {
    console.log('tick');
  }, interval.value);

  onCleanup(() => clearInterval(timer));
});
```

`onCleanup()`을 Effect 밖에서 호출하면 오류가 발생한다.

## ReactiveScope와 root

`root()`는 Owner가 전달되지 않으면 ReactiveScope를 생성하고 callback을 해당 Scope 안에서 실행한다.
callback에 전달되는 disposer를 호출하면 Scope에 속한 Effect, 자식 Scope와 정리 작업이 모두 해제된다.

기존 Owner가 전달되면 새 Scope를 만들지 않고 해당 Owner에서 callback을 실행한다.
이 경우 Owner의 연결과 해제는 Owner를 생성한 대상이 관리한다.

Owner가 전달된 경우 callback의 disposer는 해당 Owner를 영구적으로 `stop()`한다. LynElement는 DOM에서 잠시
분리된 뒤 재연결될 수 있으므로 render disposer를 호출하지 않고 Owner의 `disconnect()`와 `connect()`를
사용한다.

```ts
let dispose = () => {};

root((rootDispose) => {
  dispose = rootDispose;

  createEffect(() => {
    // 이 Effect는 현재 Scope에 등록된다.
  });
});

dispose();
```

Owner를 전달하지 않고 Scope 안에서 다시 `root()` 또는 `createScope()`를 사용하면 부모·자식 관계가 만들어진다.
부모 Scope를 정리하면 모든 자식 Scope도 함께 정리된다.

`getOwner()`는 현재 실행 중인 ReactiveScope를 반환한다.

```ts
root(() => {
  const owner = getOwner();
  console.log(owner instanceof ReactiveScope); // true
});
```

## 연결 생명주기

`connected()`는 현재 Scope가 연결될 때 실행할 callback을 등록한다.
callback이 정리 함수를 반환하면 Scope가 연결 해제되거나 중지될 때 실행한다.

```ts
root((dispose) => {
  connected(() => {
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  // dispose()를 호출하면 resize listener가 제거된다.
});
```

Owner 없이 호출한 `root()`는 callback 실행이 끝난 뒤 새 Scope를 연결한다. callback 실행 중 오류가 발생하면
생성된 Scope를 정리한 다음 오류를 다시 전달한다. Owner를 전달한 경우에는 기존 Owner를 그대로 사용한다.

## 공개 API

| API                               | 역할                                           |
| --------------------------------- | ---------------------------------------------- |
| `signal()` / `Signal`             | 반응형 값 생성 및 관리                         |
| `createEffect()`                  | Effect 생성 후 독립 disposer 반환              |
| `effect()`                        | `dom-expressions` 호환 Effect 실행             |
| `onCleanup()`                     | 현재 Effect의 cleanup 등록                     |
| `root()`                          | 새 Scope 생성 또는 전달받은 Owner 재사용       |
| `createScope()` / `ReactiveScope` | 명시적인 Owner Scope 생성 및 관리              |
| `getOwner()`                      | 현재 동기 실행 컨텍스트의 Scope 조회           |
| `connected()`                     | Scope 연결 및 해제 생명주기 callback 등록      |
| `untrack()`                       | Signal 읽기를 현재 Effect 의존성에서 제외      |
| `memo()`                          | 현재는 accessor를 그대로 반환하는 호환 구현    |
| `createComponent()`               | 현재는 컴포넌트 함수 직접 실행                 |
| `mergeProps()`                    | 현재는 `Object.assign()` 기반의 일반 객체 병합 |

## untrack

`untrack()` 안에서 읽은 Signal은 현재 Effect의 의존성으로 등록되지 않는다.

```ts
const tracked = signal(0);
const ignored = signal(0);

createEffect(() => {
  console.log(tracked.value);
  console.log(untrack(() => ignored.value));
});

tracked.value = 1; // Effect 재실행
ignored.value = 1; // Effect를 재실행하지 않음
```

## LynElement와 dom-expressions

`LynElement`는 인스턴스마다 ReactiveScope를 한 번 생성하고 연결과 해제 과정에서 재사용한다.
최초 `connectedCallback()`은 `dom-expressions`의 `render()`를 호출하고, 이후 재연결에서는 기존 DOM과 Scope를
재사용한다. `render()` 내부의 `root()`도 전달받은 LynElement Owner Scope를 그대로 사용한다.

```text
최초 connectedCallback()
├── Owner Scope connect()
└── dom-expressions.render()
    └── 같은 Owner Scope에서 root() 실행
        └── this.render() 1회 실행

LynElement.disconnectedCallback()
└── Owner Scope disconnect()
    └── Effect cleanup 및 Signal 구독 해제

재연결 connectedCallback()
└── 같은 Owner Scope connect()
    ├── 기존 Effect 재실행 및 Signal 재구독
    └── 기존 DOM 재사용
```

`disconnectedCallback()`에서는 root disposer나 `ReactiveScope.stop()`을 호출하지 않는다. DOM에서 분리되어도
LynElement 인스턴스는 다시 연결될 수 있기 때문이다. Scope의 영구 폐기와 일시적인 연결 해제를 구분한다.
분리된 동안 Signal이 변경되면 DOM은 갱신되지 않으며, 재연결 시 Effect가 다시 실행되어 최신 값을 반영한다.

## 현재 제한 사항

- Effect는 동기적으로 실행되며 변경 사항을 배치하거나 스케줄링하지 않는다.
- 실행 중인 Effect가 자신이 구독한 Signal을 변경할 경우 같은 Effect의 중첩 실행은 방지된다.
- `memo()`는 현재 값을 캐시하지 않으며 전달받은 함수를 그대로 반환하는 호환 구현이다.
- `mergeProps()`는 단순한 객체 병합이며 반응형 속성 병합은 아직 지원하지 않는다.
- 비동기 callback은 실행 컨텍스트를 자동으로 유지하지 않는다.
- 오류 경계와 순환 업데이트 감지는 아직 제공하지 않는다.
- LynElement는 재연결을 위해 Scope를 보존하며 명시적인 영구 폐기 API는 아직 제공하지 않는다.
