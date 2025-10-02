# babel-preset-lynjs

`babel-preset-lynjs` is a **Babel preset for LynJS**, providing the base environment to transform JSX into
**DOM-oriented code** without relying on a Virtual DOM. Currently, it works on top of
[`babel-plugin-jsx-dom-expressions`](https://github.com/ryansolid/dom-expressions), but in the future it will also
include **additional Babel plugins and default configurations required for LynJS**, offering a consistent and
streamlined development experience.

## Installation

```bash
npm i -D @babel/core @babel/preset-env @babel/preset-typescript babel-preset-lynjs
```

## Configuration

Add the preset to your `.babelrc` or `babel.config.json`:

```json
{
  "presets": ["lynjs"]
}
```

This single line enables JSX transformation and the essential Babel setup for LynJS without any extra configuration.

## License

BSD-3-Clause
