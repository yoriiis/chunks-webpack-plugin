# CHANGELOG

## 3.4.3

### Fixes

* Fix ignore sourceMap file and dynamic import chunk [#24](https://github.com/yoriiis/chunks-webpack-plugin/pull/24)
* Fix npm scripts
* Fix lint on Webpack config
* Fix bundle analyzer

### New features

* Add `./.vscode/launch.json` file to debugging Node.js

### Updates

* Bumps `vlitejs` from `3.0.2` to `3.0.4`
* Bumps `mini-css-extract-plugin` from `0.4.1` to `0.9.0`
* Bumps `@babel/core` from `7.7.7` to `7.8.3`
* Bumps `css-loader` from `1.0.0` to `3.4.2`
* Bumps `webpack` from `4.41.2` to `4.41.5`
* Bumps `@babel/cli` from `7.7.7` to `7.8.3`
* Bumps `eslint-plugin-import` from `2.19.1` to `2.20.0`
* Bumps `terser-webpack-plugin` from `2.2.1` to `2.3.2`
* Bumps `@babel/preset-env` from `7.7.7` to `7.8.3`
* Bumps `eslint` from `4.19.1` to `6.8.0`

### Removes

* Remove example dist files and update `.gitignore`
* Remove dist test files

## 3.4.2

### Updates

* Build source files

## 3.4.1

### New features

* Add Coveralls

### Updates

* Up code covrage to 100%

## 3.4.0

### New features

* Add Jest tests

### Updates

* Rename `demo` into `example`
* Merge example and main `package.json`

## 3.3.2

### Updates

* Bumps `@babel/preset-env` from 7.4.5 to 7.7.7
* Bumps `eslint-plugin-standard` from 3.0.1 to 3.1.0
* Bumps `eslint` from 4.18.2 to 4.19.1
* Bumps `@babel/core` from 7.7.4 to 7.7.7
* Bumps `eslint-config-standard` from 10.2.1 to 11.0.0
* Bumps `@babel/cli` from 7.7.4 to 7.7.7
* Bumps `eslint-plugin-promise` from 3.6.0 to 4.2.1
* Bumps `eslint-plugin-import` from 2.8.0 to 2.19.1
* Bumps `eslint-plugin-node` from 5.2.1 to 8.0.1
* Bumps `babel-eslint` from 8.0.1 to 10.0.3

## 3.3.1

### Fixes

* Fixed missing dependency `fs-extra` [#9](https://github.com/yoriiis/chunks-webpack-plugin/issues/9)

## 3.3.0

### New features

* Add minimalist project example to run the ChunksWebpackPlugin plugin
* Add `generateChunksManifest` option to generate chunks manifest
* Add `generateChunksFiles` to enable/disable HTML files generation.

### Updates

* Update Webpack compiler hook from `done` to `emit` to improve performance
* Split plugin code in minimalist functions and create utils functions
* Babel build now the directory `./src/`
* Replace `fs` by `fs-extra`
* Lint all Javascript files with ESLint

## 3.2.1

### Fixes

* Fixed strict node engine version break with different node version [#6](https://github.com/yoriiis/chunks-webpack-plugin/issues/6)

## 3.2.0

### New features

* Add Travis builds: `eslint`
* Add `ESLint` with `Standard JS` on the project with associated npm scripts
* Add `Babel` configuration on the project
* Add `.github` folder with `ISSUE_TEMPLATE` and `PULL_REQUEST_TEMPLATE`
* Add `./dist` folder with vLitejs assets
* Add `.editorconfig` file

## 3.0.1

### Fixes

* Fixed chunks urls when public path is not defined [#3](https://github.com/yoriiis/chunks-webpack-plugin/issues/3)

## 3.0.0

### Updates

* Add `webpack` as `peerDependencies` in the `package.json`
* Change default value of `outputPath` from `null` to `default`
* Change default value of `customFormatTags` from `null` to `false`
* Re-order `package.json` keys
* Updating and improving the documentation

## 2.0.2

### Fixes

* Prevent generate empty files
* Lint Javascript

## 2.0.1

### Fixes

* Fixed wrong public path for absolute paths [#1](https://github.com/yoriiis/chunks-webpack-plugin/issues/1)

## 2.0.0

### New features

* Add function `customFormatTags` to override the default behavior of tags generation

### Fixes

* Rename option `path` to `outputPath`

### Updates

* Add comments in code
* Update README

## 1.0.1

### Updates

* First release of `ChunksWebpackPlugin`
* Update README
