# @lynjs/test

`@lynjs/core`를 실제 브라우저 환경에서 테스트하기 위한 워크스페이스입니다.

## 설치

프로젝트 루트에서 의존성을 설치합니다.

```bash
npm install
npx playwright install chromium
```

## 테스트 실행

프로젝트 루트에서 전체 브라우저 테스트를 한 번 실행합니다.

```bash
npm test
```

테스트 워크스페이스만 직접 실행할 수도 있습니다.

```bash
npm test --workspace=@lynjs/test
```

테스트를 감시 모드로 실행하려면 다음 명령어를 사용합니다.

```bash
npm run test:watch
```

감시 모드에서는 다음 변경 사항을 자동으로 반영합니다.

- `@lynjs/core` 소스 변경 시 Core 재빌드
- 테스트 코드 변경 시 브라우저 테스트 재실행
- Core 빌드 결과 변경 시 브라우저 테스트 재실행

## 브라우저 표시

기본 테스트는 Chromium을 headless 모드로 실행합니다.

브라우저 화면을 직접 확인하려면 `vitest.config.ts`에서 `headless`를 `false`로 변경합니다.

```ts
browser: {
  enabled: true,
  headless: false,
  provider: playwright(),
  instances: [{ browser: 'chromium' }],
}
```

그다음 감시 모드를 실행합니다.

```bash
npm run test:watch
```

## 테스트 작성

브라우저 테스트 파일은 `src` 아래에 `*.test.ts` 형식으로 작성합니다.

예:

```text
packages/test/
├── src/
│   └── element.test.ts
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

`LynElement` 테스트 예시:

```ts
import { afterEach, describe, expect, it } from 'vitest';
import { LynElement } from '@lynjs/core';

class TestElement extends LynElement {
  protected render(): Node {
    const span = document.createElement('span');
    span.textContent = 'hello LynElement';

    return span;
  }
}

const tagName = 'lyn-test-element';

if (!customElements.get(tagName)) {
  customElements.define(tagName, TestElement);
}

describe('LynElement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('DOM에 연결되면 render 결과를 자식으로 추가한다', () => {
    const element = document.createElement(tagName);

    document.body.appendChild(element);

    expect(element).toBeInstanceOf(LynElement);
    expect(element.querySelector('span')?.textContent).toBe('hello LynElement');
  });
});
```

## 주요 명령어

| 명령어                                     | 설명                                                      |
| ------------------------------------------ | --------------------------------------------------------- |
| `npm test`                                 | Core를 빌드하고 브라우저 테스트를 한 번 실행합니다.       |
| `npm run test:watch`                       | Core와 테스트 변경을 감시하고 테스트를 자동 재실행합니다. |
| `npm run build --workspace=@lynjs/core`    | Core 패키지만 빌드합니다.                                 |
| `npm run test:run --workspace=@lynjs/test` | Core를 다시 빌드하지 않고 현재 빌드 결과로 테스트합니다.  |
