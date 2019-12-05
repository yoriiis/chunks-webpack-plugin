# 3.3.0

#### New features

* Add minimalist project example to run the plugin and see ChunksWebpackPlugin implementation in action with SplitChunks
* Add `generateChunksManifest` option to generate a file which contains a list of chunks grouped by entry points
* Add `generateChunksFiles` to enable/disable HTML files generation. Usefull only with addition of `generateChunksManifest` option

#### Updates

* Update Webpack compiler hook from `done` to `emit` to improve performance
* Split plugin code in minimalist functions and create utils functions
* Babel build now the directory `./src/`
* Replace `fs` by `fs-extra`
* Lint all Javascript files with ESLint


# 3.2.1

#### Fixes

* Fixed strict node engine version break with different node version [#6](https://github.com/yoriiis/chunks-webpack-plugin/issues/6)


# 3.2.0

#### New features

* Add Travis builds: `eslint`
* Add `ESLint` with `Standard JS` on the project with associated npm scripts
* Add `Babel` configuration on the project
* Add `.github` folder with `ISSUE_TEMPLATE` and `PULL_REQUEST_TEMPLATE`
* Add `./dist` folder with vLitejs assets
* Add `.editorconfig` file


# 3.0.1

#### Fixes

* Fixed chunks urls when public path is not defined [#3](https://github.com/yoriiis/chunks-webpack-plugin/issues/3)


# 3.0.0

#### Updates

* Add `webpack` as `peerDependencies` in the `package.json`
* Change default value of `outputPath` from `null` to `default`
* Change default value of `customFormatTags` from `null` to `false`
* Re-order `package.json` keys
* Updating and improving the documentation


# 2.0.2

#### Fixes

* Prevent generate empty files
* Lint Javascript


# 2.0.1

#### Fixes

* Fixed wrong public path for absolute paths [#1](https://github.com/yoriiis/chunks-webpack-plugin/issues/1)


# 2.0.0

#### New features

* Add function `customFormatTags` to override the default behavior of tags generation

#### Fixes

* Rename option `path` to `outputPath`

#### Updates

* Add comments in code
* Update README


# 1.0.1

#### Updates

* First release of `ChunksWebpackPlugin`
* Update README
