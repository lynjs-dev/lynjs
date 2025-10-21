import { defineConfig } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';

export default defineConfig({
  input: ['src/index.ts', 'src/reactive.ts', 'src/dom/client.ts'],
  treeshake: { moduleSideEffects: false },
  output: {
    dir: 'dist',
    format: 'esm',
    preserveModules: true,
    preserveModulesRoot: 'src',
    entryFileNames: '[name].js',
    sourcemap: true,
    generatedCode: 'es2015',
  },
  plugins: [
    resolve({
      browser: true,
      extensions: ['.js', '.ts', '.jsx', '.tsx'],
      exportConditions: ['browser', 'module', 'import'],
      preferBuiltins: false,
    }),

    commonjs(),
    babel({
      babelHelpers: 'bundled',
      extensions: ['.js', '.ts', '.jsx', '.tsx'],
      presets: ['babel-preset-lynjs'],
      plugins: [
        [
          'babel-plugin-transform-rename-import',
          {
            original: 'rxcore',
            replacement: '../../../src/reactive.ts',
          },
        ],
      ],
    }),
  ],
});
