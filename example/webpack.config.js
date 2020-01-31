const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const ChunksWebpackPlugin = require('../src/index');

module.exports = (env, argv) => {
	const isProduction = argv.mode === 'production';

	return {
		watch: !isProduction,
		entry: {
			'app-a': `${path.resolve(__dirname, './src/js/app-a.js')}`,
			'app-b': `${path.resolve(__dirname, './src/js/app-b.js')}`,
			'app-c': `${path.resolve(__dirname, './src/js/app-c.js')}`
		},
		watchOptions: {
			ignored: /node_modules/
		},
		devtool: 'nosources-source-map',
		output: {
			path: path.resolve(__dirname, './dist'),
			publicPath: '/dist/',
			filename: 'js/[name].js'
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
				filename: 'css/[name].css',
				chunkFilename: 'css/[name].css'
			}),
			new ChunksWebpackPlugin({
				outputPath: path.resolve(__dirname, 'dist/templates'),
				fileExtension: '.html',
				generateChunksManifest: true,
				generateChunksFiles: true,
				customFormatTags: (chunksSorted, files) => {
					// Generate all HTML style tags with CDN prefix
					const styles = chunksSorted.styles
						.map(
							chunkCss =>
								`<link rel="stylesheet" href="https://cdn.domain.com${chunkCss}" />`
						)
						.join('');

					// Generate all HTML style tags with CDN prefix and defer attribute
					const scripts = chunksSorted.scripts
						.map(
							chunkJs =>
								`<script defer src="https://cdn.domain.com${chunkJs}"></script>`
						)
						.join('');

					return { styles, scripts };
				}
			}),
			new ManifestPlugin({
				writeToFileEmit: true,
				fileName: 'manifest.json'
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
				new OptimizeCSSAssetsPlugin({})
			],
			namedChunks: false,
			namedModules: false,
			removeAvailableModules: true,
			removeEmptyChunks: true,
			mergeDuplicateChunks: true,
			occurrenceOrder: true,
			providedExports: false,
			mangleWasmImports: true,
			splitChunks: {
				chunks: 'all',
				minSize: 0,
				name: true
			}
		}
	};
};
