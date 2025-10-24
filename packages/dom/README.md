elements-expressions

# effect

Solid의 반응형에 대한 전반적인 접근 방식은 모든 반응형 계산을 함수로 래핑하고, 종속성이 업데이트될 때 해당 함수를 다시
실행하는 것입니다. Solid JSX 컴파일러는 또한 대부분의 JSX 표현식(중괄호로 묶인 코드)을 함수로 래핑하여 종속성이 변경될
때 자동으로 업데이트되고 해당 DOM 업데이트도 트리거합니다. 더 정확히 말하면, 함수의 자동 재실행은 JSX 표현식이나
"계산"을 생성하는 API 호출(createEffect, createMemo 등)과 같은 추적 범위에서 함수가 호출될 때마다 발생합니다. 기본적으로
함수의 종속성은 추적 범위에서 호출될 때 함수가 반응형 상태를 읽는 시점(예: Signal getter 또는 Store 속성)을 감지하여
자동으로 추적됩니다. 따라서 일반적으로 종속성에 대해 직접 걱정할 필요가 없습니다. (하지만 자동 종속성 추적을 통해 원하는
결과를 얻지 못하는 경우 종속성 추적을 재정의할 수 있습니다.) 이 접근 방식을 사용하면 반응성이 구성 가능해집니다. 즉,
다른 함수 내에서 한 함수를 호출하면 일반적으로 호출하는 함수가 호출된 함수의 종속성을 상속하게 됩니다.

### ⚠️ Warning: Manual DOM Manipulation

LynJS renders JSX by compiling it directly to optimized DOM operations.

If you manually manipulate the DOM (e.g., moving nodes, inserting elements), LynJS will not revalidate or restore the
node’s position on re-render.

This can lead to unexpected behavior.

To ensure predictable updates and performance:

- Avoid direct DOM manipulations
- Instead, rely on signals and JSX to declaratively control the UI

example

```ts
const el = <div>hello</div>;
insert(parent, el); // insertExpression caches this node

// later...
parent.removeChild(el); // ⚠️ dangerous
```
