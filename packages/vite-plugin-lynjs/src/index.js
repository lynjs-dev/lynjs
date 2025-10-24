import * as babel from '@babel/core';
import lynjs from 'babel-preset-lynjs';
import { createFilter } from '@rollup/pluginutils';

function getExtension(filename) {
  const index = filename.lastIndexOf('.');
  return index < 0 ? '' : filename.substring(index).replace(/\?.+$/, '');
}

export default function lynjsPlugin(options = {}) {
  options = Object.assign({ dev: !!options.dev }, options);

  const filter = createFilter(options.include, options.exclude);
  let projectRoot = process.cwd();

  return {
    name: 'lynjs',
    enforce: 'pre',

    configResolved(config) {
      projectRoot = config.root;
    },

    async transform(source, id) {
      if (!filter(id)) return null;

      const ext = getExtension(id).toLowerCase();
      const validExtensions = (options.extensions || ['.jsx', '.tsx']).map((e) => e.toLowerCase());
      if (!validExtensions.includes(ext)) return null;

      const babelOpts = {
        root: projectRoot,
        filename: id,
        sourceFileName: id,
        presets: [[lynjs, options]],
        ast: false,
        sourceMaps: true,
        configFile: false,
        babelrc: false,
      };

      let userBabelOpts = {};
      if (typeof options.babel === 'function') {
        userBabelOpts = await options.babel(source, id);
      } else if (options.babel) {
        userBabelOpts = options.babel;
      }

      const mergedOpts = {
        ...babelOpts,
        ...userBabelOpts,
        presets: [...(userBabelOpts.presets || []), [lynjs, options]],
      };

      const { code, map } = await babel.transformAsync(source, mergedOpts);
      return { code, map };
    },
  };
}
