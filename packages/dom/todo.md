## DOM 관련 함수 목록

https://github.com/ryansolid/dom-expressions/blob/main/packages/dom-expressions/src/client.js

| 이름                                    | 설명                                            | 필수 |
| :-------------------------------------- | :---------------------------------------------- | ---- |
| createElement(Comp, props, ...children) | 일반 DOM 요소 생성                              |
| Fragment(props)                         | 여러 요소 그룹화 (JSX의 <></> 대응)             |
| insert(parent, default, marker?)        | 동적 값 삽입 (string, node, function 등)        | o    |
| spread(node, props, isSVG)              | JSX의 {...props} 처리                           | o    |
| assignProps(node, props)                | 일반 속성 설정 처리                             |
| createComponent(Component, props)       | JSX 함수 컴포넌트 실행                          | o    |
| mergeProps(...sources)                  | 여러 prop 객체 병합                             | o    |
| template()                              | 정적 DOM 구조 캐싱 + cloneNode 최적화           | o    |
| delegateEvents(eventNames)              | 이벤트 위임 (addEventListener 최적화용)         | o    |
| setAttribute(node, name, default)       | 특수한 attribute 처리 (aria, boolean 등)        |
| classList(node, classes)                | 클래스 동적 처리 { active: true, error: false } | o    |
| style(node, styleObj)                   | 인라인 style 처리                               | o    |
| booleanAttribute(node, name, default)   | disabled, checked 등 처리                       | o    |
| dynamicProperty(node, name, accessor)   | 동적 속성 처리                                  |
| getNextElement()                        | 템플릿 클론 후 DOM 트리의 nextSibling 찾기      |
| effect(fn)                              | signal 기반 반응형 연결                         |
| createSignal(initial)                   | 기본 상태 관리 함수                             |
| memo(fn, equals?)                       | 계산 캐싱                                       |

```aiignore
@lynjs/elements/
├── index.js                  ← 위 함수들 구현
├── templateCache.js          ← template() 구현용 캐시
├── reactivity.js             ← createSignal, effect, memo 등
├── elements/insert.js             ← insert(), spread() 등
├── elements/events.js             ← delegateEvents()
└── elements/props.js              ← setAttribute, classList, style 등
```

## 용어 설명

| 용어           | 설명                                                                                   |
| :------------- | :------------------------------------------------------------------------------------- |
| Hydration      | SSR(서버 사이드 렌더링)된 HTML을 클라이언트에서 “살려서” 상호작용 가능하게 만드는 과정 |
| Hydration hook | 이 과정에서 DOM과 상태를 연결하기 위한 위치 포인터 또는 마커 함수                      |
