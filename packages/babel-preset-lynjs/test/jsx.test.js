const babel = require('@babel/core');
const preset = require('babel-preset-lynjs');

describe('babel-preset-lynjs', () => {
  test('should transform JSX into LynJS DOM template call', () => {
    const result = babel.transformSync('const v = <input disabled value={2} />;', {
      presets: [preset],
      babelrc: false,
      compact: true,
      filename: 'core.tsx',
    });

    expect(result.code).toContain('import{template as _$template}from"@lynjs/dom";');
    expect(result.code).toContain('var _tmpl$=/*#__PURE__*/_$template(`<input disabled value=2>`);');
    expect(result.code).toContain('const v=_tmpl$();');
  });
});
