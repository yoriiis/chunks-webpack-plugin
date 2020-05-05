# CHANGELOG

## 6.1.0

### Fixes

- Fix `isValidCustomFormatTagsDatas` function too strict, `styles` and `scripts` keys can now be empty if no chunks are found.

> HTML files will not be written on the disk for empty chunks

### Updates

- Update the second parameter of the function `customFormatTags`. `files` is replaced by `Entrypoint`. See the dedicated section in the [README](README.md#Entrypoint).

## 6.0.1

### Fixes

- Fix missing `publicPath`

## 6.0.0

### New features

- Add Typescript to the Webpack plugin

### Updates

- Replace Travis CI by Github Actions

## 5.0.0

### New features

- Add Husky `pre-commit` with `eslint`, `markdown` and `test` scripts

### Updates

- Rework and split code into small functions to facilitate testing
- Complete rewrite of tests

### Breaking changes

- Change default value of `outputPath` constructor option from `default` to `null`. If the parameter is omit or `null`, the plugin will use the `options.output.path` option from the [Webpack configuration](<(https://webpack.js.org/configuration/output/#outputpath)>).

## 4.0.3

### Fixes

- Options `generateChunksManifest` and `generateChunksFiles` can now operate independently [#53](https://github.com/yoriiis/chunks-webpack-plugin/issues/53)

### Updates

- Improve Jest tests

## 4.0.2

### New features

- Add Stryker mutation in the Travis CI to improve tests quality

### Updates

- Update `customFormatTagsDatasIsValid` function to prevent empty content
- Simplify `customFormatTags` check (replace `typeof` and `Boolean` by `instanceof`)
- Update Jest tests with mutation testing
- Update dependencies

## 4.0.1

### Updates

- Optimize `utils.getFileExtension` with native Node.js `extname` function
- Bumps [webpack-cli](https://github.com/webpack/webpack-cli) from 3.3.10 to 3.3.11.
- Bumps [eslint-plugin-import](https://github.com/benmosher/eslint-plugin-import) from 2.20.0 to 2.20.1.
- Bumps [@babel/preset-env](https://github.com/babel/babel) from 7.8.3 to 7.8.4.
- Bumps [webpack](https://github.com/webpack/webpack) from 4.41.5 to 4.41.6.
- Bumps [terser-webpack-plugin](https://github.com/webpack-contrib/terser-webpack-plugin) from 2.3.2 to 2.3.5.
- Bumps [markdownlint-cli](https://github.com/igorshubovych/markdownlint-cli) from 0.21.0 to 0.22.0.

## 4.0.0

### Updates

- Refacto `chunkGroups`, use `compilation.entrypoints` Map object to get all valid entrypoints and associated files
- Update ESLint config, add semicolon on all Javascript files

### Removes

- Remove `build` npm script, use directly `./src` directory as entry point

## 3.4.6

### Fixes

- Fix comptibility support with Webpack `v4.0.0` [#39](https://github.com/yoriiis/chunks-webpack-plugin/issues/39)

## 3.4.5

### New features

- Add Discord chat

### Updates

- Update Travis CI with more Node.js versions (`node`, `lts/*`, `12.14.0`, `8.11.2`)

## 3.4.4

### New features

- Add `markdownlint` to lint markdown files

### Updates

- Upgrade Node.js version to `12.14.0`
- Bumps `eslint-config-standard` from `11.0.0` to `14.1.0`
- Bumps `eslint-plugin-node` from `8.0.1` to `11.0.0`
- Bumps `eslint-plugin-standard` from `3.1.0` to `4.0.1`
- Update Travis config with markdown lint script
- Lint `CHANGELOG.md` and `README.md`
- Update Github `ISSUE_TEMPLATE`
- Update `.npmignore`

## 3.4.3

### Fixes

- Fix ignore sourceMap file and dynamic import chunk [#24](https://github.com/yoriiis/chunks-webpack-plugin/pull/24)
- Fix npm scripts
- Fix lint on Webpack config
- Fix bundle analyzer

### New features

- Add `./.vscode/launch.json` file to debugging Node.js

### Updates

- Bumps `vlitejs` from `3.0.2` to `3.0.4`
- Bumps `mini-css-extract-plugin` from `0.4.1` to `0.9.0`
- Bumps `@babel/core` from `7.7.7` to `7.8.3`
- Bumps `css-loader` from `1.0.0` to `3.4.2`
- Bumps `webpack` from `4.41.2` to `4.41.5`
- Bumps `@babel/cli` from `7.7.7` to `7.8.3`
- Bumps `eslint-plugin-import` from `2.19.1` to `2.20.0`
- Bumps `terser-webpack-plugin` from `2.2.1` to `2.3.2`
- Bumps `@babel/preset-env` from `7.7.7` to `7.8.3`
- Bumps `eslint` from `4.19.1` to `6.8.0`

### Removes

- Remove example dist files and update `.gitignore`
- Remove dist test files

## 3.4.2

### Updates

- Build source files

## 3.4.1

### New features

- Add Coveralls

### Updates

- Up code covrage to 100%

## 3.4.0

### New features

- Add Jest tests

### Updates

- Rename `demo` into `example`
- Merge example and main `package.json`

## 3.3.2

### Updates

- Bumps `@babel/preset-env` from 7.4.5 to 7.7.7
- Bumps `eslint-plugin-standard` from 3.0.1 to 3.1.0
- Bumps `eslint` from 4.18.2 to 4.19.1
- Bumps `@babel/core` from 7.7.4 to 7.7.7
- Bumps `eslint-config-standard` from 10.2.1 to 11.0.0
- Bumps `@babel/cli` from 7.7.4 to 7.7.7
- Bumps `eslint-plugin-promise` from 3.6.0 to 4.2.1
- Bumps `eslint-plugin-import` from 2.8.0 to 2.19.1
- Bumps `eslint-plugin-node` from 5.2.1 to 8.0.1
- Bumps `babel-eslint` from 8.0.1 to 10.0.3

## 3.3.1

### Fixes

- Fixed missing dependency `fs-extra` [#9](https://github.com/yoriiis/chunks-webpack-plugin/issues/9)

## 3.3.0

### New features

- Add minimalist project example to run the ChunksWebpackPlugin plugin
- Add `generateChunksManifest` option to generate chunks manifest
- Add `generateChunksFiles` to enable/disable HTML files generation.

### Updates

- Update Webpack compiler hook from `done` to `emit` to improve performance
- Split plugin code in minimalist functions and create utils functions
- Babel build now the directory `./src/`
- Replace `fs` by `fs-extra`
- Lint all Javascript files with ESLint

## 3.2.1

### Fixes

- Fixed strict node engine version break with different node version [#6](https://github.com/yoriiis/chunks-webpack-plugin/issues/6)

## 3.2.0

### New features

- Add Travis builds: `eslint`
- Add `ESLint` with `Standard JS` on the project with associated npm scripts
- Add `Babel` configuration on the project
- Add `.github` folder with `ISSUE_TEMPLATE` and `PULL_REQUEST_TEMPLATE`
- Add `./dist` folder with vLitejs assets
- Add `.editorconfig` file

## 3.0.1

### Fixes

- Fixed chunks urls when public path is not defined [#3](https://github.com/yoriiis/chunks-webpack-plugin/issues/3)

## 3.0.0

### Updates

- Add `webpack` as `peerDependencies` in the `package.json`
- Change default value of `outputPath` from `null` to `default`
- Change default value of `customFormatTags` from `null` to `false`
- Re-order `package.json` keys
- Updating and improving the documentation

## 2.0.2

### Fixes

- Prevent generate empty files
- Lint Javascript

## 2.0.1

### Fixes

- Fixed wrong public path for absolute paths [#1](https://github.com/yoriiis/chunks-webpack-plugin/issues/1)

## 2.0.0

### New features

- Add function `customFormatTags` to override the default behavior of tags generation

### Fixes

- Rename option `path` to `outputPath`

### Updates

- Add comments in code
- Update README

## 1.0.1

### Updates

- First release of `ChunksWebpackPlugin`
- Update README
