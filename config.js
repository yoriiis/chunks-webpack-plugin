const webpack4_41_5 = require('webpack4.41.5')
const webpack4_4_0 = require('webpack4.4.0')
let webpack

// condition for which webpack version to use
// bonus, setting config object's 'output.filename' based on condition
if (process.argv.indexOf('webpack@4.41.5') !== -1) {
	webpack = webpack4_41_5
}

if (process.argv.indexOf('webpack@4.4.0') !== -1) {
	webpack = webpack4_4_0
}

const path = require('path')
// const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserJSPlugin = require('terser-webpack-plugin')
const ManifestPlugin = require('webpack-manifest-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const ChunksWebpackPlugin = require('./src/index')

const config = {
	watch: false,
	entry: {
		'app-a': `${path.resolve(__dirname, './example/src/js/app-a.js')}`,
		'app-b': `${path.resolve(__dirname, './example/src/js/app-b.js')}`,
		'app-c': `${path.resolve(__dirname, './example/src/js/app-c.js')}`
	},
	watchOptions: {
		ignored: /node_modules/
	},
	devtool: 'nosources-source-map',
	output: {
		path: path.resolve(__dirname, './example/dist'),
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
					// MiniCssExtractPlugin.loader,
					{
						loader: 'css-loader'
					}
				]
			}
		]
	},
	plugins: [
		// new MiniCssExtractPlugin({
		// 	filename: 'css/[name].css',
		// 	chunkFilename: 'css/[name].css'
		// }),
		new ChunksWebpackPlugin({
			outputPath: path.resolve(__dirname, './example/dist/templates'),
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
					.join('')

				// Generate all HTML style tags with CDN prefix and defer attribute
				const scripts = chunksSorted.scripts
					.map(
						chunkJs => `<script defer src="https://cdn.domain.com${chunkJs}"></script>`
					)
					.join('')

				return { styles, scripts }
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
}

// Run webpack from node
webpack(config, (err, stats) => {
	if (err || stats.hasErrors()) {
		// Fatal webpack errors (wrong configuration, etc)
		if (err) {
			console.error(err.stack || err)
			if (err.details) {
				console.error(err.details)
			}
			process.exit(1)
		}

		const info = stats.toJson()
		// Compilation errors (missing modules, syntax errors, etc)
		if (stats.hasErrors()) {
			for (const error of info.errors) {
				console.error(error)
			}
			process.exit(2)
		}

		// Compilation warnings
		if (stats.hasWarnings()) {
			console.warn(info.warnings)
		}
	}
	// Done processing
	console.log(
		stats.toString({
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
		})
	)
})
