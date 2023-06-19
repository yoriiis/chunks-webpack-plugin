import path from 'path';
import { fileURLToPath } from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserJSPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import ChunksWebpackPlugin from '../lib/index.js';

const __dirname = path.dirname(__filename);

export default (env, argv) => {
	const isProduction = argv.mode === 'production';

	return {
		context: __dirname, // Context is mandatory because webpack use the flag "--config"
		watch: !isProduction,
		entry: {
			'shared/app-a': `${path.resolve(__dirname, './src/js/app-a.js')}`,
			'app-b': `${path.resolve(__dirname, './src/js/app-b.js')}`,
			'app-c': `${path.resolve(__dirname, './src/js/app-c.js')}`
		},
		watchOptions: {
			ignored: /node_modules/
		},
		cache: {
			type: 'filesystem'
		},
		devtool: false,
		output: {
			path: path.resolve(__dirname, './dist'),
			publicPath: '/dist/',
			filename: `js/[name].js`
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
				filename: 'css/[name].css'
			}),
			new ChunksWebpackPlugin({
				filename: '/templates/[name]-[type].html',
				templateStyle: (name) =>
					`<link rel="stylesheet" href="https://cdn.domain.com${name}" />`,
				templateScript: (name) =>
					`<script defer src="https://cdn.domain.com${name}"></script>`,
				generateChunksManifest: true,
				generateChunksFiles: true
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
