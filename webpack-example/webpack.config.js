const path = require('path')
const ChunksWebpackPlugin = require('../src/index')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const ManifestPlugin = require('webpack-manifest-plugin')

module.exports = (env, argv) => {
	const isProduction = argv.mode === 'production'

	return {
		watch: !isProduction,
		entry: {
			'app-a': './src/js/app-a.js',
			'app-b': './src/js/app-B.js'
		},
		watchOptions: {
			ignored: /node_modules/
		},
		devtool: 'none',
		output: {
			path: path.resolve(__dirname, './dist'),
			publicPath: '/dist/',
			filename: 'js/[name].js'
		},
		module: {
			rules: [{
				test: /\.js$/,
				use: [{
					loader: 'babel-loader'
				}]
			}, {
				test: /\.css$/,
				use: [
					MiniCssExtractPlugin.loader, {
						loader: 'css-loader'
					}
				]
			}]
		},
		plugins: [
			new MiniCssExtractPlugin({
				filename: `css/[name].css`,
				chunkFilename: `css/[name].css`
			}),
			new ChunksWebpackPlugin({
				outputPath: path.resolve(__dirname, 'dist/templates'),
				fileExtension: '.html',
				generateChunksManifest: true
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
			minimize: isProduction,
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
	}
}
