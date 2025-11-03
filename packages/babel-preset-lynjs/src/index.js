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
    presets: [
      [
        '@babel/preset-env',
        {
          debug: false,
          modules: false,
          targets: {
            chrome: 58,
            safari: 12,
            firefox: 58,
          },
        },
      ],
      ['@babel/preset-typescript', { allowDeclareFields: true }],
    ],

    plugins: [
      ['@babel/plugin-transform-typescript', { allowDeclareFields: true }],
      [
        '@babel/plugin-proposal-decorators',
        {
          version: '2023-05',
          decoratorsBeforeExport: true, // TC39 트랜스폼
        },
      ],
      [
        '@babel/plugin-transform-class-properties',
        {
          loose: true,
          useDefineForClassFields: true,
        },
      ],
      ['@babel/plugin-transform-private-methods', { loose: true }],
      ['@babel/plugin-transform-private-property-in-object', { loose: true }],
    ],

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
