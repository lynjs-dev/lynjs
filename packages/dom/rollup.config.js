import { defineConfig } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';

export default defineConfig({
  input: ['src/index.ts', 'src/client.ts'],
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
      extensions: ['.js', '.ts'],
      exportConditions: ['module', 'import'],
      preferBuiltins: false,
    }),

    commonjs(),
    babel({
      babelHelpers: 'bundled',
      extensions: ['.js', '.ts'],
      presets: ['@babel/preset-typescript'],
      plugins: [
        [
          'babel-plugin-transform-rename-import',
          {
            original: 'rxcore',
            replacement: '@lynjs/reactive',
          },
        ],
      ],
    }),
  ],
});
