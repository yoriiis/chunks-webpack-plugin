# ChunksWebpackPlugin

![GitHub Workflow Status (branch)](https://img.shields.io/github/actions/workflow/status/yoriiis/chunks-webpack-plugin/build.yml?branch=master&style=for-the-badge) [![Coverage Status](https://img.shields.io/coveralls/github/yoriiis/chunks-webpack-plugin?style=for-the-badge)](https://coveralls.io/github/yoriiis/chunks-webpack-plugin?branch=master) [![Mutation testing badge](https://img.shields.io/endpoint?style=for-the-badge&url=https://badge-api.stryker-mutator.io/github.com/yoriiis/chunks-webpack-plugin/master)](https://dashboard.stryker-mutator.io/reports/github.com/yoriiis/chunks-webpack-plugin/master) [![Npm downloads](https://img.shields.io/npm/dm/chunks-webpack-plugin?color=fb3e44&label=npm%20downloads&style=for-the-badge)](https://npmjs.com/package/chunks-webpack-plugin)

The `ChunksWebpackPlugin` creates HTML files with entry points and chunks relations to serve your webpack bundles. It is suitable with multi-page applications that contain multiple entry points.

Since webpack 4, `SplitChunksPlugin` offers the possibility to optimizes all chunks. It can be particularly powerful, because it means that chunks can be shared even between async and non-async chunks. See the webpack documentation of [`splitChunks.chunks`](https://webpack.js.org/plugins/split-chunks-plugin/#splitchunkschunks) for details.

`splitChunks.chunks` option can be set to automatically generate new chunks associated with an entry point. For example, entry points `a.js` and `b.js` share common code with the file `vendors~a~b.js`.

With multiple entry points, it can be difficult to identify relation between the auto-generated chunks and entry points.

`ChunksWebpackPlugin` parses the `entrypoints` [Map](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Map) from the webpack compilation to get all valid entry points and associated files. Then, it generates HTML files which include all assets filtered by an entry point and the `chunks-manifest.json` file.

## Zero configuration

It works without configuration. For advanced usage, see the [using configuration section](#using-a-configuration).

## Installation

`ChunksWebpackPlugin` is available on npm as [`chunks-webpack-plugin`](https://www.npmjs.com/package/chunks-webpack-plugin) and as [`chunks-webpack-plugin` on GitHub](https://github.com/yoriiis/chunks-webpack-plugin).

```bash
npm install chunks-webpack-plugin --save-dev
```

```bash
yarn add chunks-webpack-plugin --dev
```

## Environment

`ChunksWebpackPlugin` was built for Node.js LTS 14 and webpack 5.

## Example

The project includes a minimalist example in the `./example` directory. Run the `npm run build:example` command to execute the Webpack example and see ChunksWebpackPlugin implementation in action with SplitChunks.

## Basic usage

`ChunksWebpackPlugin` will generate two HTML files for each entry point. Each filename contains the entry point name, the `{{entry}}` placeholder is automatically replaced.

- `{{entry}}-styles.html`: contains all HTML `<link>` tags
- `{{entry}}-scripts.html`: contains all HTML `<script>` tags

First, let's add the plugin to the webpack configuration.

```js
const ChunksWebpackPlugin = require('chunks-webpack-plugin');
const path = require('path');

module.exports = {
  entry: 'main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, './dist')
  },
  plugins: [new ChunksWebpackPlugin()]
};
```

HTML files are built in the output path directory with the rest of the webpack output.

Now you can include the generated HTML files into your HTML page templates. You can do it with e.g. Twig.

**main-styles.html**

```html
<link rel="stylesheet" href="main.css" />
```

**main-scripts.html**

```html
<script src="main.js"></script>
```

---

## Using a configuration

You can pass a configuration object to `ChunksWebpackPlugin` to override the default settings.

### `filename`

`string = '[name]-[type].html'`

Tells the plugin whether to personalize the filename of the generated files. Files are processed by the webpack compilation and generated in the output path directory.

> 💡 `[name]` is automatically replaced by the entrypoint name and `[type]` by `styles|scripts`.
>
> The filename can contain directories, which will be created automatically.

```js
new ChunksWebpackPlugin({
  filename: 'templates/[name]-[type].html'
});
```

### `templateStyle`

`string = '<link rel="stylesheet" href="{{chunk}}" />'`

Tells the plugin whether to personalize the default template for the HTML `<style>` tags. For example, add additional attributes or a CDN prefix.

```js
new ChunksWebpackPlugin({
  templateStyle: '<link rel="stylesheet" href="https://cdn.domain.com/{{chunk}}" />'
});
```

> 💡 Keep the `{{chunk}}` placeholder, it is automatically replaced by the concatenation of the webpack public path and the chunk filename.

### `templateScript`

`string = '<script src="{{chunk}}"></script>'`

Tells the plugin whether to personalize the default template for the HTML `<script>` tags. For example, add additional attributes or a CDN prefix.

```js
new ChunksWebpackPlugin({
  templateScript: '<script defer src="{{chunk}}"></script>'
});
```

> 💡 Keep the `{{chunk}}` placeholder, it is automatically replaced by the concatenation of the webpack public path and the chunk filename.

### `outputPath`

`string = null`

Tells the plugin whether to personalize the output path of generated files (need absolute path). By default the plugin will use `options.output.path` from the [Webpack configuration](https://webpack.js.org/configuration/output/#outputpath).

> 💡 Can be used to generate files outside the webpack output path directory. With this option, files are not processed by the webpack compilation.

```javascript
new ChunksWebpackPlugin({
  outputPath: path.resolve(__dirname, `./templates`)
});
```

### `customFormatTags`

`boolean: false` `function (chunksSorted, Entrypoint) => object`

Tells the plugin whether to personalize the default behavior for generating your own templates. The function is called for each entry point. Can be used to add a custom behavior for a specific entry point.

```js
new ChunksWebpackPlugin({
  customFormatTags: (chunksSorted, Entrypoint) => {
    // Generate all HTML style tags with a CDN prefix
    const styles = chunksSorted.styles
      .map((chunkCss) => `<link rel="stylesheet" href="https://cdn.domain.com/${chunkCss}" />`)
      .join('');

    // Generate all HTML style tags with CDN prefix and defer attribute
    const scripts = chunksSorted.scripts
      .map((chunkJs) => `<script defer src="https://cdn.domain.com/${chunkJs}"></script>`)
      .join('');

    return { styles, scripts };
  }
});
```

> 💡 The function provides more flexibility by replacing the default behavior. Follow the example above to make sure it works.

The function must return an object with the following format:

```js
return {
  styles: '',
  scripts: ''
};
```

#### `chunksSorted`

`object`

The list of the chunks sorted by type: `styles` and `scripts`.

#### `Entrypoint`

`object`

The object is included in every single ChunkGroup. The variable contains all information about the current entry point; log it on the console for more details.

> 💡 Use this variable only for a full customization if the `chunksSorted` variable does not meet your needs.

### `generateChunksManifest`

`boolean = false`

Tells the plugin whether to generate the `chunks-manifest.json`. The file contains the list of all chunks grouped by entry points.

```js
new ChunksWebpackPlugin({
  generateChunksManifest: true
});
```

Example of the output of the `chunks-manifest.json` file:

```json
{
  "app-a": {
    "styles": ["/dist/css/vendors~app-a~app-b.css", "/dist/css/app-a.css"],
    "scripts": ["/dist/js/vendors~app-a~app-b.js", "/dist/js/app-a.js"]
  },
  "app-b": {
    "styles": ["/dist/css/vendors~app-a~app-b.css", "/dist/css/app-b.css"],
    "scripts": ["/dist/js/vendors~app-a~app-b.js", "/dist/js/app-b.js"]
  }
}
```

### `generateChunksFiles`

`boolean = true`

Tells the plugin whether to generate the HTML files.

```js
new ChunksWebpackPlugin({
  generateChunksFiles: false
});
```

> 💡 When set to `false`, HTML files will not be generated. It can only be useful together with `generateChunksManifest` option set to `true` for custom generation of the HTML files.

### Caching

The [webpack caching](https://webpack.js.org/guides/caching) feature allows you to generate HTML files that include hash in the filename.

```js
const ChunksWebpackPlugin = require('chunks-webpack-plugin');
const path = require('path');

module.exports = {
  entry: 'main.js',
  output: {
    filename: 'bundle.[contenthash].js',
    path: path.resolve(__dirname, './dist')
  },
  plugins: [new ChunksWebpackPlugin()]
};
```

This will generate the following HTML files with hash in the filename.

**main-styles.html**

```html
<link rel="stylesheet" href="main.72dd90acdd3d4a4a1fd4.css" />
```

**main-scripts.html**

```html
<script src="main.72dd90acdd3d4a4a1fd4.js"></script>
```

### Multiple entry points

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

The plugin will generate all files in the `./dist/` directory:

**home-styles.html**

```html
<link rel="stylesheet" href="vendors~home~news.css" /> <link rel="stylesheet" href="home.css" />
```

**home-scripts.html**

```html
<script src="vendors~home~news.js"></script>
<script src="home.js"></script>
```

**news-styles.html**

```html
<link rel="stylesheet" href="vendors~home~news.css" /> <link rel="stylesheet" href="news.css" />
```

**news-scripts.html**

```html
<script src="vendors~home~news.js"></script>
<script src="news.js"></script>
```

## Licence

ChunksWebpackPlugin is licensed under the [MIT License](http://opensource.org/licenses/MIT).

Created with ♥ by [@yoriiis](http://github.com/yoriiis).
