const jsxTransform = require('babel-plugin-jsx-dom-expressions');
const transformTypeScript = require('@babel/plugin-transform-typescript');

module.exports = function (context, options) {
  const jsxOpts = Object.assign(
    {
      moduleName: 'lynjs/dom',
      contextToCustomElements: true,
      wrapConditionals: true,
      generate: 'dom',
    },
    options,
  );

  return {
    overrides: [
      {
        test: /\.ts$/,
        plugins: [[transformTypeScript, { allowDeclareFields: true }]],
      },
      {
        test: /\.tsx$/,
        plugins: [
          [transformTypeScript, { isTSX: true, allowDeclareFields: true }],
          [jsxTransform, jsxOpts],
        ],
      },
      {
        test: /\.jsx$/,
        plugins: [[jsxTransform, jsxOpts]],
      },
    ],
  };
};
