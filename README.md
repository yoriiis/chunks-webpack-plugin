# ChunksWebpackPlugin

![GitHub Workflow Status (branch)](https://img.shields.io/github/actions/workflow/status/yoriiis/chunks-webpack-plugin/build.yml?branch=main&style=for-the-badge) [![Coverage Status](https://img.shields.io/coveralls/github/yoriiis/chunks-webpack-plugin?style=for-the-badge)](https://coveralls.io/github/yoriiis/chunks-webpack-plugin?branch=main) [![Npm downloads](https://img.shields.io/npm/dm/chunks-webpack-plugin?color=fb3e44&label=npm%20downloads&style=for-the-badge)](https://npmjs.com/package/chunks-webpack-plugin)

The `chunks-webpack-plugin` creates HTML files with entry points and chunks relations to serve your webpack bundles. It is suitable with multi-page applications that contain multiple entry points.

Since webpack 4, `SplitChunksPlugin` offers the possibility to optimizes all chunks. It can be particularly powerful, because it means that chunks can be shared even between async and non-async chunks. See the webpack documentation of [`splitChunks.chunks`](https://webpack.js.org/plugins/split-chunks-plugin/#splitchunkschunks) for details.

`splitChunks.chunks` option can be set to automatically generate new chunks associated with an entry point. For example, entry points `a.js` and `b.js` share common code with the file `vendors~a~b.js`.

With multiple entry points, it can be difficult to identify relation between the auto-generated chunks and entry points.

`chunks-webpack-plugin` parses the webpack compilation entry points to get all files associated with the entry points. Then, it generates HTML files which include all assets filtered by an entry point and the`chunks-manifest.json` file.

## Zero configuration

It works without configuration. For advanced usage, see the [using configuration section](#using-a-configuration).

## Installation

`chunks-webpack-plugin` is available on npm as [`chunks-webpack-plugin`](https://www.npmjs.com/package/chunks-webpack-plugin) and as [`chunks-webpack-plugin` on GitHub](https://github.com/yoriiis/chunks-webpack-plugin).

```bash
npm install chunks-webpack-plugin --save-dev
```

```bash
yarn add chunks-webpack-plugin --dev
```

## Environment

`chunks-webpack-plugin` was built for Node.js `>=16.20.0` and webpack `v5`.

## Example

The project includes a minimalist example in the `./example` directory. Run the `npm run build:example` command to execute the Webpack example and see the plugin's implementation in action.

## Basic usage

`chunks-webpack-plugin` will generate two HTML files for each entry point. Each filename contains the entry point name, the `{{entry}}` placeholder is automatically replaced.

- `{{entry}}-styles.html`: contains all HTML `<link>` tags
- `{{entry}}-scripts.html`: contains all HTML `<script>` tags

First, let's add the plugin to the webpack configuration.

**webpack.config.js**

```js
const ChunksWebpackPlugin = require('chunks-webpack-plugin');

module.exports = {
  plugins: [new ChunksWebpackPlugin()]
};
```

HTML files are built in the output path directory with the rest of the webpack compilation.

Now you can include the generated HTML files into your HTML page templates. You can do it with e.g. Twig.

**main-styles.html**

```html
<link rel="stylesheet" href="main.css" />
```

**main-scripts.html**

```html
<script defer src="main.js"></script>
```

---

## Using a configuration

You can pass a configuration object to `chunks-webpack-plugin` to override the default settings.

### `filename`

Type:

```ts
type filename = string;
```

Default: `'[name]-[type].html'`

Tells the plugin whether to personalize the filename of the generated files. Files are processed by the webpack compilation and generated in the output path directory. The placeholder `[name]` is automatically replaced by entry points names and `[type]` by `styles|scripts`.

```js
new ChunksWebpackPlugin({
  filename: 'templates/[name]-[type].html'
});
```

> **Note** The `filename` can contain directories, which will be created automatically.

### `templateStyle`

Type:

```ts
type templateStyle = (name: string, entryName: string) => string;
```

Default:

```js
(name) => `<link rel="stylesheet" href="${name}" />`;
```

Tells the plugin whether to personalize the default template for the HTML `<style>` tags. For example, add additional attributes or a CDN prefix.

```js
module.exports = {
  plugins: [
    new ChunksWebpackPlugin({
      templateStyle: (name) => `<link rel="stylesheet" href="https://cdn.domain.com${name}" />`
    })
  ]
};
```

### `templateScript`

Type:

```ts
type templateScript = (name: string, entryName: string) => string;
```

Default:

```js
(name) => `<script defer src="${name}"></script>`;
```

Tells the plugin whether to personalize the default template for the HTML `<script>` tags. For example, add additional attributes or a CDN prefix.

```js
module.exports = {
  plugins: [
    new ChunksWebpackPlugin({
      templateScript: (name) => `<script defer src="https://cdn.domain.com${name}"></script>`
    })
  ]
};
```

### `generateChunksManifest`

Type:

```ts
type generateChunksManifest = boolean;
```

Default: `false`

Tells the plugin whether to generate the `chunks-manifest.json`. The file contains the list of all chunks grouped by entry points. See the [chunks-manifest.json example](example/dist/chunks-manifest.json).

```js
module.exports = {
  plugins: [
    new ChunksWebpackPlugin({
      generateChunksManifest: true
    })
  ]
};
```

### `generateChunksFiles`

Type:

```ts
type generateChunksFiles = boolean;
```

Default: `true`

Tells the plugin whether to generate the HTML files.

```js
module.exports = {
  plugins: [
    new ChunksWebpackPlugin({
      generateChunksFiles: false
    })
  ]
};
```

> **Warning** When set to `false`, HTML files will not be generated. It can **only** be useful together with `generateChunksManifest` option set to `true` for custom generation of the HTML files.

---

<details>

<summary>Multiple entrypoints example</summary>

## Multiple entrypoints example

Example of the webpack configuration with multiple entry points which share common code with the `splitChunks` option.

```js
const ChunksWebpackPlugin = require('chunks-webpack-plugin');
const path = require('path');

module.exports = {
  entry: {
    home: 'home.js',
    news: 'news.js'
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, './dist')
  },
  plugins: [new ChunksWebpackPlugin()],
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  }
};
```

The plugin will generate all files in the output path directory:

**home-styles.html**

<!-- prettier-ignore -->
```html
<link rel="stylesheet" href="vendors~home~news.css" />
<link rel="stylesheet" href="home.css" />
```

**home-scripts.html**

```html
<script defer src="vendors~home~news.js"></script>
<script defer src="home.js"></script>
```

**news-styles.html**

<!-- prettier-ignore -->
```html
<link rel="stylesheet" href="vendors~home~news.css" />
<link rel="stylesheet" href="news.css" />
```

**news-scripts.html**

```html
<script defer src="vendors~home~news.js"></script>
<script defer src="news.js"></script>
```

</details>

## License

`chunks-webpack-plugin` is licensed under the [MIT License](http://opensource.org/licenses/MIT).

Created with ♥ by [@yoriiis](http://github.com/yoriiis).
