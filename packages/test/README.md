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

- `@lynjs/core` TypeScript 소스 변경 시 테스트 모듈 다시 변환
- 테스트 코드 변경 시 브라우저 테스트 재실행

Test는 Core의 `dist`가 아니라 `packages/core/src`를 직접 참조하므로 테스트 전에 Core를 빌드할 필요가 없습니다.

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

브라우저 테스트 파일은 `src` 아래에 `*.test.ts` 또는 `*.test.tsx` 형식으로 작성합니다.

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

| 명령어                                     | 설명                                                       |
| ------------------------------------------ | ---------------------------------------------------------- |
| `npm run build`                            | 프로젝트 루트에서 Core 배포 결과를 빌드합니다.             |
| `npm test`                                 | Core 소스를 직접 참조하여 브라우저 테스트를 실행합니다.    |
| `npm run test:watch`                       | Core와 테스트 소스 변경 시 테스트를 자동으로 재실행합니다. |
| `npm run test:run --workspace=@lynjs/test` | Test 워크스페이스의 브라우저 테스트를 한 번 실행합니다.    |
