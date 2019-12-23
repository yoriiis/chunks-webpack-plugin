<p>
	<img alt="TravisCI" src="https://img.shields.io/badge/chunks--webpack--plugin-v3.4.0-546e7a.svg?style=for-the-badge">
	<a href="https://travis-ci.com/yoriiis/chunks-webpack-plugin">
		<img alt="TravisCI" src="https://img.shields.io/travis/com/yoriiis/chunks-webpack-plugin/master?style=for-the-badge">
	</a>
	<img alt="Node.js" src="https://img.shields.io/node/v/chunks-webpack-plugin?style=for-the-badge">
	<a href="https://bundlephobia.com/result?p=fela@latest">
		<img alt="Bundlephobia" src="https://img.shields.io/bundlephobia/minzip/chunks-webpack-plugin?style=for-the-badge">
	</a>
	<a href="https://coveralls.io/github/yoriiis/chunks-webpack-plugin?branch=master">
    <img src="https://img.shields.io/coveralls/github/yoriiis/chunks-webpack-plugin?style=for-the-badge" alt="Coverage Status" />
  </a>
	<a href="https://npmjs.com/package/chunks-webpack-plugin">
		<img alt="Npm downloads" src="https://img.shields.io/npm/dm/chunks-webpack-plugin?color=fb3e44&label=npm%20downloads&style=for-the-badge">
	</a>
</p>

# ChunksWebpackPlugin

The `ChunksWebpackPlugin` create HTML files to serve your webpack bundles. It is very convenient with multiple entry points and it works without configuration.

Since Webpack 4, <a href="https://webpack.js.org/plugins/split-chunks-plugin" title="SplitChunksPlugin" target="_blank">SplitChunksPlugin</a> offer the possibility to optimizes all chunks. It can be particularly powerful, because it means that chunks can be shared even between async and non-async chunks. See Webpack documentation for <a href="https://webpack.js.org/plugins/split-chunks-plugin/#splitchunkschunks" title="splitChunks.chunks" target="_blank">`splitChunks.chunks`</a>.

This option automatically generate new chunks associated with an entrypoint. For example, entry points `a.js` and `b.js` share common codes with `vendors~a~b.js`.

With multiple entry points, it can be difficult to identify relation between auto-generated chunks and entry points.

The plugin parse the new `chunkGroups` option in the Webpack compilation object, to generate HTML files which includes all assets **filtered by** entrypoint and the `chunks-manifest.json` file.

[Read the article about the SplitChunksPlugin on Medium](https://medium.com/@Yoriiis/the-real-power-of-webpack-4-splitchunks-plugin-fad097c45ba0).

## Zero config

The `chunks-webpack-plugin` works without configuration.

## Installation

The plugin is available as the `chunks-webpack-plugin` package name on <a href="https://www.npmjs.com/package/chunks-webpack-plugin" title="ChunksWebpackPlugin on npm" target="_blank">npm</a> and <a href="https://github.com/yoriiis/chunks-webpack-plugin" title="ChunksWebpackPlugin on Github" target="_blank">Github</a>.

```
npm i --save-dev chunks-webpack-plugin
```
```
yarn add --dev chunks-webpack-plugin
```

## Environment

`ChunksWebpackPlugin` was built for Node.js `>=8.11.2` and Webpack `>=4.x`.

## Example

The project includes a minimalist example in the `./example` directory. Run the `npm run build:example` command to execute the Webpack example and see ChunksWebpackPlugin implementation in action with SplitChunks.

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
  entry: 'main.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'main.js'
  },
  plugins: [
    new ChunksWebpackPlugin()
  ]
};
```

This will generate the following HTML files in the `./dist/` directory. Defaut `output.path` is used.

```html
<!--main-styles.html-->
<link rel="stylesheet" href="main.css"/>
```

```html
<!--main-scripts.html-->
<script src="main.js"></script>
```

## Using a configuration

You can pass configuration options to `ChunksWebpackPlugin`. Allowed values are as follows:

#### `outputPath`

`string = 'default'`

Tells plugin whether to personalize the output path of generated files (need absolute path). By default the plugin will use `output.path` from the Webpack configuration.

```javascript
new ChunksWebpackPlugin({
    outputPath: path.resolve(__dirname, `./templates`)
})
```

#### `fileExtension`

`string = '.html'`

Tells plugin whether to personalize the extension of generated files.

```javascript
new ChunksWebpackPlugin({
    fileExtension: '.php'
})
```

#### `templateStyle`

`string = '<link rel="stylesheet" href="{{chunk}}" />'`

Tells plugin whether to personalize the default template for HTML `<style>` tags. Add attributes, a CDN prefix or something else.

>Keep `{{chunk}}` placeholder, it is automatically replace by the Webpack public path and chunk filename.

```javascript
new ChunksWebpackPlugin({
    templateStyle: `<link rel="stylesheet" href="{{chunk}}" />`
})
```

#### `templateScript`

`string = '<script src="{{chunk}}"></script>'`

Tells plugin whether to personalize the default template for HTML `<script>` tags. Add attributes, a CDN prefix or something else.

>Keep `{{chunk}}` placeholder, it is automatically replace by the Webpack public path and chunk filename.


```javascript
new ChunksWebpackPlugin({
    templateScript: `<script src="{{chunk}}"></script>`
})
```

#### `customFormatTags`

`false || function (chunksSorted, chunkGroup)
`

Tells plugin whether to personalize the default behavior for generate your own templates. The function is called for each entry points. Custom behavior can also be add for a specific entrypoint if necessary. The arrow function syntax allow you to access the class properties.

The `customFormatTags` function has two parameters:

##### `chunksSorted`

`object`

List of chunks sorted by type: `styles` and `scripts`.

##### `chunkGroup`

`object`

Webpack `chunkGroup` object for each entry points.

> This function overrides the default behavior, you need to generate yourself your templates, like the example below:

```javascript
new ChunksWebpackPlugin({
    customFormatTags: (chunksSorted, chunkGroup) => {
        // Generate all HTML style tags with CDN prefix
        const styles = chunksSorted['styles'].map(chunkCss =>
          `<link rel="stylesheet" href="https://cdn.domain.com${chunkCss}" />`
        ).join('')

        // Generate all HTML style tags with CDN prefix and defer attribute
        const scripts = chunksSorted['scripts'].map(chunkJs =>
          `<script defer src="https://cdn.domain.com${chunkJs}"></script>`
        ).join('')

        return { styles, scripts }
    }
})
```

The function need to return an object with the following format:

```json
{
    "styles": "",
    "scripts": ""
}
```

#### `generateChunksManifest`

`boolean = false`

Tells plugin whether to generate the `chunks-manifest.json` file which contains a list of chunks grouped by entry points. This file can be particulary usefull if you need the list of chunks associated by entry point in your application (like Symfony with `assets` function or others).

```javascript
new ChunksWebpackPlugin({
    generateChunksManifest: false
})
```

Example of the output of `chunks-manifest.json` file:

```json
{
  "app-a": {
    "styles": [
      "/dist/css/vendors~app-a~app-b.css",
      "/dist/css/app-a.css"
    ],
    "scripts": [
      "/dist/js/vendors~app-a~app-b.js",
      "/dist/js/app-a.js"
    ]
  },
  "app-b": {
    "styles": [
      "/dist/css/vendors~app-a~app-b.css",
      "/dist/css/app-b.css"
    ],
    "scripts": [
      "/dist/js/vendors~app-a~app-b.js",
      "/dist/js/app-b.js"
    ]
  }
}
```

#### `generateChunksFiles`

`boolean = true`

Tells plugin whether to generate HTML files which contains styles and scripts tag of chunks by entry points. This option can be particulary usefull only with addition of `generateChunksManifest` option.

```javascript
new ChunksWebpackPlugin({
    generateChunksManifest: true
})
```

### Caching

With <a href="https://webpack.js.org/guides/caching" title="Webpack caching" target="">Webpack caching</a> option, it is very convenient to generate HTML files which includes path with hash.

```javascript
var ChunksWebpackPlugin = require('chunks-webpack-plugin');
var path = require('path');

module.exports = {
  entry: 'main.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'bundle.[contenthash].js'
  },
  plugins: [new ChunksWebpackPlugin()]
};
```

This will generate the following HTML files in `./dist/` folder:

```html
<!--main-styles.html-->
<link rel="stylesheet" href="main.72dd90acdd3d4a4a1fd4.css"/>
```

```html
<!--main-scripts.html-->
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

```html
<!--home-styles.html-->
<link rel="stylesheet" href="vendors~home~news.css"/>
<link rel="stylesheet" href="home.css"/>
```

```html
<!--home-scripts.html-->
<script src="vendors~home~news.js"></script>
<script src="home.js"></script>
```

```html
<!--news-styles.html-->
<link rel="stylesheet" href="vendors~home~news.css"/>
<link rel="stylesheet" href="news.css"/>
```

```html
<!--news-scripts.html-->
<script src="vendors~home~news.js"></script>
<script src="news.js"></script>
```

## Licence

ChunksWebpackPlugin is licensed under the [MIT License](http://opensource.org/licenses/MIT).<br />
Created with ♥ by [@yoriiis](http://github.com/yoriiis).
