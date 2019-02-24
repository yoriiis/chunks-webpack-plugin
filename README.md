![ChunksWebpackPlugin](https://img.shields.io/badge/ChunksWebpackPlugin-v1.0.0-1a6bac.svg?style=flat-square)

# ChunksWebpackPlugin

The ChunksWebpackPlugin create HTML files to serve your webpack bundles. It is very convenient with multiple entry points and it works without configuration.

Since Webpack 4, <a href="https://webpack.js.org/plugins/split-chunks-plugin" title="SplitChunksPlugin" target="_blank">SplitChunksPlugin</a> offer the possibility to optimizes all chunks. It can be particularly powerful, because it means that chunks can be shared even between async and non-async chunks. See Webpack documentation for <a href="https://webpack.js.org/plugins/split-chunks-plugin/#splitchunkschunks" title="splitChunks.chunks" target="_blank">`splitChunks.chunks`</a>.

This option automatically generate new chunks associated with a entrypoint. For example, entry points `a.js` and `b.js` share common codes with `vendors~a~b.js`.

With multiple entry points, it can be difficult to identify relation between auto-generated chunks and entry points.

The plugin parse the new `chunkGroups` option in the Webpack compilation object, to generate HTML files which includes all assets **filtered by** entrypoint.

## Zero config

The `chunks-webpack-plugin` works without configuration.

## Installation

The plugin is available as the `chunks-webpack-plugin` package on <a href="https://www.npmjs.com/package/chunks-webpack-plugin" title="ChunksWebpackPlugin on npm" target="_blank">npm</a> and <a href="https://github.com/yoriiis/chunks-webpack-plugin" title="ChunksWebpackPlugin on Github" target="_blank">Github</a>.

```
npm install --save-dev chunks-webpack-plugin
```

## Environment

ChunksWebpackPlugin was built for Node.js 8.x and Webpack 4.x

## Basic usage

The plugin will generate for you two HTML5 files for each entry points. Each filename contains the entrypoint name, `{{entry}}` is dynamically replace.

* `{{entry}}-styles.html`: contains all HTML `<link>` tags
* `{{entry}}-scripts.html`: contains all HTML `<script>` tags

You are free to call where you want, each HTML files in the associated templates corresponding to an entrypoint.

Just add the plugin to your webpack config as follows:

```javascript
var ChunksWebpackPlugin = require('chunks-webpack-plugin');
var path = require('path');

module.exports = {
  entry: 'index.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'bundle.js'
  },
  plugins: [new ChunksWebpackPlugin()]
};
```

This will generate the following HTML files in `./dist/` folder:

**main-styles.html**
```html
<link rel="stylesheet" href="main.css"/>
```

**main-scripts.html**
```html
<script src="main.js"></script>
```

## Using a configuration

You can pass configuration options to ChunksWebpackPlugin. Allowed values are as follows:

* `path` - The output path of generated files (default `output.path`)
* `fileExtension` - The extension of generated files (default `.html`)
* `templateStyle` - Custom template for HTML `<style>` tags
* `templateScript` - Custom template for HTML `<script>` tags

```javascript
var ChunksWebpackPlugin = require('chunks-webpack-plugin');
var path = require('path');

module.exports = {
    entry: 'index.js',
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'bundle.js'
    },
    plugins: [
        new ChunksWebpackPlugin({
            path: path.resolve(__dirname, `./built`),
            fileExtension: '.html.twig',
            templateStyle: `<link rel="stylesheet" href="https://cdn.domain.com{{chunk}}"/>`,
            templateScript: `<script async src="https://cdn.domain.com{{chunk}}"></script>`
        })
    ]
};
```

**Keep `{{chunk}}` placeholder**, it is automatically replace by the Webpack public path and chunk filename.

Custom templates allows to writes your own tags with for example custom attributes (async, defer) or add a CDN url before assets path.

### Caching

With <a href="https://webpack.js.org/guides/caching" title="Webpack caching" target="">Webpack caching</a> option, it is very convenient to generate HTML files which includes path with hash.

```javascript
var ChunksWebpackPlugin = require('chunks-webpack-plugin');
var path = require('path');

module.exports = {
  entry: 'index.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'bundle.[hash].js'
  },
  plugins: [new ChunksWebpackPlugin()]
};
```

This will generate the following HTML files in `./dist/` folder:

**main-styles.html**
```html
<link rel="stylesheet" href="main.72dd90acdd3d4a4a1fd4.css"/>
```

**main-scripts.html**
```html
<script src="main.72dd90acdd3d4a4a1fd4.js"></script>
```

### Multiple entry points

Example of Webpack configuration with multiple entry points which share common codes:

```javascript
var ChunksWebpackPlugin = require('chunks-webpack-plugin');
var path = require('path');

module.exports = {
  entry: {
      home: 'home.js',
      news: 'news.js'
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'bundle.js'
  },
  plugins: [new ChunksWebpackPlugin()]
};
```

The plugin will generate all files in `./dist/` folder:

**home-styles.html**
```html
<link rel="stylesheet" href="vendors~home~news.css"/>
<link rel="stylesheet" href="home.css"/>
```

**home-scripts.html**
```html
<script src="vendors~home~news.js"></script>
<script src="home.js"></script>
```

**news-styles.html**
```html
<link rel="stylesheet" href="vendors~home~news.css"/>
<link rel="stylesheet" href="news.css"/>
```

**news-scripts.html**
```html
<script src="vendors~home~news.js"></script>
<script src="news.js"></script>
```

## Licence

Available with the <a href="https://github.com/yoriiis/chunks-webpack-plugin/blob/master/LICENSE" title="MIT licence" target="_blank">MIT licence</a>.