# LynJS

LynJS는 Web Standards를 기반으로 반응형 Custom Element를 작성하기 위한 TypeScript 라이브러리다.

```tsx
import { LynElement, state } from 'lynjs';

class LynCounter extends LynElement {
  @state count = 0;

  protected render(): Node {
    return <button onClick={() => this.count++}>Count: {() => this.count}</button>;
  }
}

customElements.define('lyn-counter', LynCounter);
```

> LynJS는 현재 초기 개발 단계다. 공개 API와 빌드 설정은 정식 릴리스 전까지 변경될 수 있다.

## 철학

### Web Standards 위에 구축한다

LynJS의 컴포넌트는 별도의 컴포넌트 모델을 흉내 내는 객체가 아니라 실제 Custom Element다.
`LynElement`는 `HTMLElement`를 상속하며 브라우저의 `customElements`, 연결 및 해제 callback과 DOM API를
그대로 사용한다. 라이브러리가 제공하지 않는 기능도 표준 DOM API로 확장할 수 있어야 한다.

```text
HTMLElement
└── LynElement
    └── 사용자 Custom Element
```

### 사용자는 의도를 선언한다

데코레이터는 프레임워크 내부의 구현 방법이 아니라 프로퍼티의 역할을 표현한다.

```ts
@state count = 0;
```

사용자는 Signal, getter, setter 또는 auto-accessor를 직접 구성하지 않는다. `@state`가 일반 필드를
Signal 기반 반응형 프로퍼티로 변환하며, 사용하는 쪽에서는 평범한 값처럼 읽고 쓴다.

```ts
this.count++;
console.log(this.count);
```

### 필요한 작업만 다시 실행한다

LynJS는 fine-grained reactivity를 사용한다. Effect가 실행되는 동안 읽은 Signal을 의존성으로 기록하고,
값이 변경되면 해당 Signal을 읽은 Effect만 다시 실행한다. 컴포넌트 전체를 다시 렌더링하거나 가상 DOM을
비교하지 않는다.

```text
@state 프로퍼티 읽기
└── Signal과 현재 Effect 연결

@state 프로퍼티 변경
└── 연결된 Effect만 실행
    └── 관련 DOM 갱신
```

### DOM 생명주기와 반응형 생명주기를 연결한다

`LynElement`는 인스턴스마다 하나의 ReactiveScope를 사용한다. Element가 DOM에서 분리되면 Effect 구독을
일시 정지하고, 같은 인스턴스가 다시 연결되면 기존 Scope와 DOM을 재사용해 최신 상태를 반영한다.
DOM에서 분리됐다는 이유만으로 상태, Scope 또는 렌더링 결과를 영구 폐기하지 않는다.

### 역할을 작게 나눈다

```text
Decorators        상태와 프로퍼티의 역할 선언
Reactive runtime  Signal, Effect와 Scope 관리
LynElement        Custom Element 생명주기 연결
DOM runtime       JSX 생성과 부분 DOM 갱신
```

현재 JSX 변환과 DOM 작업에는 `babel-plugin-jsx-dom-expressions`와 `dom-expressions`를 사용한다. LynJS의
reactive runtime은 `dom-expressions`가 요구하는 반응성 API를 제공한다.

## 현재 제공하는 기능

- `LynElement` 기반 Custom Element
- JSX를 `Node`로 반환하는 `render()`
- 일반 클래스 필드에 사용하는 `@state`
- Signal과 Effect 기반 fine-grained reactivity
- DOM 연결 해제 및 재연결에 대응하는 ReactiveScope
- `dom-expressions` 호환 JSX 및 reactive runtime 진입점
- 루트 `dist` 빌드와 타입 선언 및 source map 생성

아직 `@property`, attribute reflection, 이벤트 데코레이터와 computed API는 공개 API로 제공하지 않는다.

## 요구사항

- Node.js 24 이상
- TypeScript의 최신 표준 데코레이터 문법
- Custom Elements를 지원하는 브라우저
- 현재 JSX 구성에서는 Vite와 Babel 7

## 설치

```sh
npm install lynjs
```

현재 JSX와 표준 데코레이터를 변환하려면 다음 개발 의존성이 필요하다.

```sh
npm install --save-dev vite \
  @babel/core@^7 \
  @babel/preset-typescript@^7 \
  @babel/plugin-proposal-decorators@^7 \
  babel-plugin-jsx-dom-expressions \
  vite-plugin-babel
```

## TypeScript 설정

`tsconfig.json`에서 JSX를 Babel 변환 단계까지 보존하고 표준 데코레이터 타입을 포함한다.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "ESNext.Decorators"],
    "module": "Preserve",
    "moduleResolution": "Bundler",
    "jsx": "preserve",
    "strict": true
  },
  "include": ["src"]
}
```

`experimentalDecorators`는 레거시 TypeScript 데코레이터 설정이므로 활성화하지 않는다.

## JSX 타입 설정

프로젝트에 `src/jsx.d.ts`를 만들고 LynJS JSX 런타임의 타입을 전역 JSX namespace에 연결한다.

```ts
import type { JSX as LynJSX } from 'lynjs/jsx-runtime';

declare global {
  namespace JSX {
    type Element = Node;

    interface IntrinsicElements extends LynJSX.IntrinsicElements {}
  }
}

export {};
```

## Vite와 Babel 설정

`vite.config.ts`에서 TypeScript, 표준 데코레이터와 JSX 변환을 구성한다.

```ts
import babel from 'vite-plugin-babel';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      rxcore: 'lynjs/rxcore',
    },
  },

  plugins: [
    babel({
      include: /\.tsx(?:$|\?)/,
      exclude: /node_modules/,
      babelConfig: {
        sourceMaps: true,
        presets: [
          [
            '@babel/preset-typescript',
            {
              isTSX: true,
              allExtensions: true,
            },
          ],
        ],
        plugins: [
          ['@babel/plugin-proposal-decorators', { version: '2023-11' }],
          [
            'babel-plugin-jsx-dom-expressions',
            {
              moduleName: 'lynjs/jsx-runtime',
              generate: 'dom',
              delegateEvents: false,
            },
          ],
        ],
      },
    }),
  ],
});
```

`rxcore` alias는 현재 `dom-expressions` 내부의 reactive runtime import를 `lynjs/rxcore`에 연결한다.

## 첫 번째 Element 작성

`src/lyn-counter.tsx`를 작성한다.

```tsx
import { LynElement, state } from 'lynjs';

export class LynCounter extends LynElement {
  @state count = 0;

  constructor() {
    super();
    this.count = 1;
  }

  protected render(): Node {
    return (
      <button type="button" onClick={() => this.count++}>
        Count: {() => this.count}
      </button>
    );
  }
}

if (!customElements.get('lyn-counter')) {
  customElements.define('lyn-counter', LynCounter);
}
```

`@state`는 필드 초기화 직후 Signal 기반 getter와 setter를 설치한다. 따라서 생성자 본문에서 값을
변경해도 Signal에 반영된다.

애플리케이션 진입점에서 모듈을 가져온다.

```ts
import './lyn-counter';
```

HTML에서 표준 Custom Element처럼 사용한다.

```html
<lyn-counter></lyn-counter>
```

## LynElement

사용자 Element는 `LynElement`를 상속하고 `render()`를 구현한다.

```tsx
class HelloElement extends LynElement {
  protected render(): Node {
    return <span>Hello LynJS</span>;
  }
}
```

현재 `render()`는 하나의 `Node`를 반환해야 한다. 최초로 DOM에 연결될 때 결과를 Element의 자식으로
추가하며 기본 렌더링 대상은 Shadow DOM이 아닌 Light DOM이다.

```text
<hello-element>
  <span>Hello LynJS</span>
</hello-element>
```

Custom Element는 자동으로 Shadow DOM을 만들지 않는다. 필요한 경우 향후 LynJS의 Shadow DOM 정책이
정해질 때까지 표준 `attachShadow()` 사용과 렌더링 대상 변경을 별도로 설계해야 한다.

## State

`@state`는 일반 클래스 필드를 반응형 상태로 만든다.

```ts
class UserCard extends LynElement {
  @state name = 'Lyn';
  @state selected = false;
}
```

상태는 인스턴스와 프로퍼티별로 분리된다. TypeScript의 `private` 접근 제한자도 사용할 수 있다.

```ts
@state private count = 0;
```

ECMAScript의 `#private` 필드는 런타임에서 property descriptor를 재정의할 수 없으므로 지원하지 않는다.

```ts
// 지원하지 않음
@state #count = 0;
```

## Reactive API

Reactive runtime은 `lynjs/rxcore`에서 가져올 수 있다.

```ts
import { createEffect, onCleanup, root, signal } from 'lynjs/rxcore';

const count = signal(0);

const dispose = root((disposeRoot) => {
  createEffect(() => {
    console.log(count.value);
    onCleanup(() => console.log('cleanup'));
  });

  return disposeRoot;
});

count.value = 1;
dispose();
```

일반적인 Element 상태에는 직접 `signal()`을 만들기보다 `@state` 사용을 권장한다. Reactive API는
LynJS의 DOM 런타임과 고급 사용 사례를 위한 저수준 API다.

## 개발

```sh
npm install
npm run build
npm test
npm run lint:all
npm run format
```

빌드 결과는 루트 `dist`에 생성되며 npm 패키지에는 `dist`, `README.md`와 `LICENSE`가 포함된다.

## 라이선스

BSD-3-Clause
