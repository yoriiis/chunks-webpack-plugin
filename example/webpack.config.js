const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const ChunksWebpackPlugin = require('../lib/index.js');

module.exports = (env, argv) => {
	const isProduction = argv.mode === 'production';

	return {
		entry: {
			'app-a': `${path.resolve(__dirname, './src/js/app-a.js')}`,
			'app-b': `${path.resolve(__dirname, './src/js/app-b.js')}`,
			'app-c': `${path.resolve(__dirname, './src/js/app-c.js')}`
		},
		watchOptions: {
			ignored: /node_modules/
		},
		devtool: isProduction ? false : 'nosources-source-map',
		output: {
			path: path.resolve(__dirname, './dist'),
			publicPath: '/dist/',
			filename: `js/[name]${isProduction ? '.[contenthash]' : ''}.js`
		},
		module: {
			rules: [
				{
					test: /\.js$/,
					use: [
						{
							loader: 'babel-loader'
						}
					]
				},
				{
					test: /\.css$/,
					use: [
						MiniCssExtractPlugin.loader,
						{
							loader: 'css-loader'
						}
					]
				}
			]
		},
		plugins: [
			new MiniCssExtractPlugin({
				filename: `css/[name]${isProduction ? '.[contenthash]' : ''}.css`
			}),
			new ChunksWebpackPlugin({
				filename: 'templates/[name]-[type].html',
				generateChunksManifest: true,
				generateChunksFiles: true,
				customFormatTags: (chunksSorted, Entrypoint) => {
					// Generate all HTML style tags with CDN prefix
					const styles = chunksSorted.styles
						.map(
							(chunkCss) =>
								`<link rel="stylesheet" href="https://cdn.domain.com${chunkCss}" />`
						)
						.join('');

					// Generate all HTML style tags with CDN prefix and defer attribute
					const scripts = chunksSorted.scripts
						.map(
							(chunkJs) =>
								`<script defer src="https://cdn.domain.com${chunkJs}"></script>`
						)
						.join('');

					return { styles, scripts };
				}
			})
		],
		stats: {
			assets: true,
			colors: true,
			hash: false,
			timings: true,
			chunks: false,
			chunkModules: false,
			modules: false,
			children: false,
			entrypoints: false,
			excludeAssets: /.map$/,
			assetsSort: '!size'
		},
		optimization: {
			minimizer: [
				new TerserJSPlugin({
					extractComments: false
				}),
				new CssMinimizerPlugin()
			],
			chunkIds: 'deterministic', // or 'named'
			removeAvailableModules: true,
			removeEmptyChunks: true,
			mergeDuplicateChunks: true,
			providedExports: false,
			mangleWasmImports: true,
			splitChunks: {
				chunks: 'all',
				minSize: 0
			}
		}
	};
};
