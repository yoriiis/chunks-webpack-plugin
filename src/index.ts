import {
	type Compiler,
	type Compilation,
	type NormalModule,
	type Chunk,
	type Module,
	type Asset,
	sources
} from 'webpack';
import path = require('path');
import { validate } from 'schema-utils';
import { Schema } from 'schema-utils/declarations/validate';
import unTypedSchemaOptions from './schemas/plugin-options.json';
import { Chunks, HtmlTags, Manifest, PluginOptions, Data } from './interfaces';
const webpack = require('webpack');
const schemaOptions = unTypedSchemaOptions as Schema;
const { RawSource } = webpack.sources;

class ChunksWebpackPlugin {
	options: PluginOptions;
	entryNames!: Array<string>;
	publicPath!: string;
	outputPath!: null | string;
	pathFromFilename!: string;
	/**
	 * Instanciate the constructor
	 * @param {object} options Plugin options
	 */
	constructor(options: PluginOptions) {
		// Merge default options with user options
		this.options = Object.assign(
			{
				filename: '[name]-[type].html',
				templateStyle: (name: string, entryName: string) =>
					`<link rel="stylesheet" href="${name}" />`,
				templateScript: (name: string, entryName: string) =>
					`<script defer src="${name}"></script>`,
				generateChunksManifest: false,
				generateChunksFiles: true
			},
			options
		);

		validate(schemaOptions, this.options, {
			name: 'ChunksWebpackPlugin',
			baseDataPath: 'options'
		});

		this.addAssets = this.addAssets.bind(this);
	}

	/**
	 * Apply function is automatically called by the Webpack main compiler
	 * @param {Object} compiler The Webpack compiler variable
	 */
	apply(compiler: Compiler): void {
		compiler.hooks.thisCompilation.tap('ChunksWebpackPlugin', this.hookCallback.bind(this));
	}

	/**
	 * Hook expose by the Webpack compiler
	 * @param {Object} compilation The Webpack compilation variable
	 */
	async hookCallback(compilation: Compilation): Promise<void> {
		compilation.hooks.processAssets.tapPromise(
			{
				name: 'ChunksWebpackPlugin',
				stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
			},
			this.addAssets.bind(this, compilation)
		);
	}

	/**
	 * Add assets
	 * The hook is triggered by webpack
	 */
	async addAssets(compilation: Compilation): Promise<void> {
		// For better compatibility with future webpack versions
		const RawSource = compilation.compiler.webpack.sources.RawSource;

		const cache = compilation.getCache('ChunksWebpackPlugin');
		const publicPath = this.getPublicPath(compilation);
		const entryNames = compilation.entrypoints.keys();
		const customData: Array<any> = [];
		const manifest: Manifest = {};

		await Promise.all(
			Array.from(entryNames).map(async (entryName: string) => {
				const chunks: any = this.getFilesDependenciesByEntrypoint({
					compilation,
					entryName
				});

				// console.log({ entryName, chunks });
				// debugger;

				// For empty chunks
				if (!chunks?.css.length && chunks?.js.length) {
					return;
				}

				// CSS
				const eTagCss = chunks.css.map((item: any) =>
					cache.getLazyHashedEtag(item.source as sources.Source)
				);
				const cacheItemCss = cache.getItemCache(entryName, eTagCss);

				let outputCss: any = await cacheItemCss.getPromise();
				if (!outputCss) {
					const data = this.getDataByType({
						assets: chunks.css,
						entryName,
						publicPath
					});
					console.log(data);

					outputCss = {
						source: new RawSource(data.htmlTags, false),
						// chunks: chunks.css,
						filePath: data.filePath,
						htmlTags: data.htmlTags,
						filename: this.options.filename
							.replace('[name]', entryName)
							.replace('[type]', 'styles')
					};

					await cacheItemCss.storePromise(outputCss);
				}

				compilation.emitAsset(outputCss.filename, outputCss.source);

				// JS
				const eTagJs = chunks.css.map((item: any) =>
					cache.getLazyHashedEtag(item.source as sources.Source)
				);
				const cacheItemJs = cache.getItemCache(entryName, eTagJs);

				let outputJs: any = await cacheItemJs.getPromise();
				if (!outputJs) {
					const data = this.getDataByType({
						assets: chunks.js,
						entryName,
						publicPath
					});
					console.log(data);

					outputJs = {
						source: new RawSource(data.htmlTags, false),
						// chunks: chunks.js,
						filePath: data.filePath,
						htmlTags: data.htmlTags,
						filename: this.options.filename
							.replace('[name]', entryName)
							.replace('[type]', 'scripts')
					};

					await cacheItemJs.storePromise(outputJs);
				}

				compilation.emitAsset(outputJs.filename, outputJs.source);

				customData.push({
					entryName,
					css: {
						source: outputCss.source
					},
					js: {
						source: outputJs.source
					}
				});
				debugger;
				manifest[entryName] = {
					styles: outputCss.filePath,
					scripts: outputJs.filePath
				};
			})
		);
		console.log({ manifest });
		if (!customData.length) {
			return;
		}

		// Need to sort (**always**), to have deterministic build
		// const eTag = customData
		// 	.sort((a, b) => a.entryName.localeCompare(b.entryName))
		// 	.map((item) => {
		// 		// const sources = [...item.styles.source, ...item.scripts.source];
		// 		// return sources.map((source) => cache.getLazyHashedEtag(source));
		// 		return cache.getLazyHashedEtag(item.styles.source);
		// 	})
		// 	.reduce((result, item) => cache.mergeEtags(result, item));

		const entrySorted = customData.sort((a, b) => a.entryName.localeCompare(b.entryName));
		const eTagCss = entrySorted.map((item) => {
			return cache.getLazyHashedEtag(item.css.source);
		});
		const eTagJs = entrySorted.map((item) => {
			return cache.getLazyHashedEtag(item.js.source);
		});
		const eTag = [...eTagCss, ...eTagJs].reduce((result, item) =>
			cache.mergeEtags(result, item)
		);

		if (this.options.generateChunksManifest) {
			await this.createChunksManifestFile({ compilation, cache, eTag, manifest });
		}
	}

	/**
	 * Get SVGs filtered by entrypoints
	 * @param {Compilation} compilation Webpack compilation
	 * @param {String} entryName Entrypoint name
	 * @returns {Array<NormalModule>} Svgs list
	 */
	getFilesDependenciesByEntrypoint({
		compilation,
		entryName
	}: {
		compilation: Compilation;
		entryName: string;
	}): Array<Chunks> {
		const listDependencies: any = {
			css: [],
			js: []
		};

		// When you use module federation you can don't have entries
		const entries = compilation.entrypoints;
		if (!entries || entries.size === 0) {
			return [];
		}

		const entry = entries.get(entryName);
		if (!entry) {
			return [];
		}

		entry.getFiles().map((file) => {
			const extension = path.extname(file).substr(1);
			if (['css', 'js'].includes(extension)) {
				listDependencies[extension].push(compilation.getAsset(file));
			}
		});

		return listDependencies;
	}

	/**
	 * Get the public path from Webpack configuation
	 * and add slash at the end if necessary
	 * @return {String} The public path
	 */
	getPublicPath(compilation: Compilation): string {
		let publicPath = compilation.options.output.publicPath || '';

		// Default value for the publicPath is "auto"
		// The value must be generated automatically from the webpack compilation data
		if (publicPath === 'auto') {
			publicPath = `/${path.relative(
				compilation.options.context || '',
				compilation.options.output.path || ''
			)}`;
		} else if (typeof publicPath === 'function') {
			publicPath = publicPath();
		}

		// return '';
		return `${publicPath}${this.isPublicPathNeedsEndingSlash(publicPath) ? '/' : ''}`;
	}

	getDataByType({
		assets,
		entryName,
		publicPath
	}: {
		assets: Array<Asset>;
		entryName: string;
		publicPath: string;
	}): Data {
		const filePath: Array<string> = [];
		const htmlTags: Array<string> = [];

		assets.forEach((asset: Asset) => {
			const filename = `${publicPath}${asset.name}`;
			filePath.push(filename);
			htmlTags.push(this.options.templateScript(filename, entryName));
		});

		return {
			filePath,
			htmlTags: htmlTags.join('')
		};
	}

	/**
	 * Check if the publicPath need an ending slash
	 * @param {String} publicPath Public path
	 * @returns {Boolean} The public path need an ending slash
	 */
	isPublicPathNeedsEndingSlash(publicPath: string): boolean {
		return !!(publicPath && publicPath.substr(-1) !== '/');
	}

	async createChunksManifestFile({
		compilation,
		cache,
		eTag,
		manifest
	}: {
		compilation: Compilation;
		cache: any;
		eTag: any;
		manifest: Manifest;
	}): Promise<void> {
		const RawSource = compilation.compiler.webpack.sources.RawSource;

		const cacheItem = cache.getItemCache('chunks-manifest.json', eTag);
		let output: sources.RawSource = await cacheItem.getPromise();

		if (!output) {
			output = new RawSource(JSON.stringify(manifest, null, 2), false);
			await cacheItem.storePromise(output);
		}

		compilation.emitAsset('chunks-manifest.json', output);
	}
}

export = ChunksWebpackPlugin;
