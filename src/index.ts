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
import {
	FilesDependencies,
	Manifest,
	PluginOptions,
	AssetData,
	TemplateFunction,
	EntryCache,
	AllData
} from './interfaces';
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
	 * @async
	 * @param {Compilation} compilation Webpack compilation
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
	 * @async
	 * @param {Compilation} compilation Webpack compilation
	 * @returns {Promise<void>}
	 */
	async addAssets(compilation: Compilation): Promise<void> {
		// For better compatibility with future webpack versions
		const RawSource = compilation.compiler.webpack.sources.RawSource;

		const cache = compilation.getCache('ChunksWebpackPlugin');
		const entryNames = compilation.entrypoints.keys();
		const customData: Array<AllData> = [];
		const manifest: Manifest = {};

		let outputCss: EntryCache;
		let outputJs: EntryCache;

		await Promise.all(
			Array.from(entryNames).map(async (entryName: string) => {
				const filesDependencies = this.getFilesDependenciesByEntrypoint({
					compilation,
					entryName
				});
				console.log({ entryName, filesDependencies });

				const publicPath = this.getPublicPath(compilation);

				if (filesDependencies.css.length) {
					const eTagCss = filesDependencies.css.map((item: any) =>
						cache.getLazyHashedEtag(item.source as sources.Source)
					);
					const cacheItemCss = cache.getItemCache(entryName, eTagCss);

					outputCss = await cacheItemCss.getPromise();
					if (!outputCss) {
						const data = this.getAssetData({
							templateFunction: this.options.templateStyle,
							assets: filesDependencies.css,
							entryName,
							publicPath
						});
						console.log('data css', data);

						outputCss = {
							source: new RawSource(data.htmlTags, false),
							filePath: data.filePath,
							htmlTags: data.htmlTags,
							filename: this.options.filename
								.replace('[name]', entryName)
								.replace('[type]', 'styles')
						};

						await cacheItemCss.storePromise(outputCss);
					}

					compilation.emitAsset(outputCss.filename, outputCss.source);
				}

				if (filesDependencies.js.length) {
					const eTagJs = filesDependencies.css.map((item: any) =>
						cache.getLazyHashedEtag(item.source as sources.Source)
					);
					const cacheItemJs = cache.getItemCache(entryName, eTagJs);

					outputJs = await cacheItemJs.getPromise();
					if (!outputJs) {
						const data = this.getAssetData({
							templateFunction: this.options.templateScript,
							assets: filesDependencies.js,
							entryName,
							publicPath
						});
						console.log('data js', data);

						outputJs = {
							source: new RawSource(data.htmlTags, false),
							filePath: data.filePath,
							htmlTags: data.htmlTags,
							filename: this.options.filename
								.replace('[name]', entryName)
								.replace('[type]', 'scripts')
						};

						await cacheItemJs.storePromise(outputJs);
					}

					compilation.emitAsset(outputJs.filename, outputJs.source);
				}

				const dataTest: AllData = {
					entryName
				};
				manifest[entryName] = {
					styles: [],
					scripts: []
				};

				if (outputCss) {
					dataTest.css = {
						source: outputCss.source
					};
					manifest[entryName].styles = outputCss.filePath;
				}
				if (outputJs) {
					dataTest.js = {
						source: outputJs.source
					};
					manifest[entryName].scripts = outputJs.filePath;
				}
				customData.push(dataTest);
			})
		);

		if (!customData.length) {
			return;
		}

		// Need to sort (**always**), to have deterministic build
		const entrySorted = customData.sort((a, b) => a.entryName.localeCompare(b.entryName));

		const eTagCss =
			entrySorted.map(
				(item) => item.css && item.css.source && cache.getLazyHashedEtag(item.css.source)
			) || [];

		const eTagJs =
			entrySorted.map(
				(item) => item.js && item.js.source && cache.getLazyHashedEtag(item.js.source)
			) || [];
		const eTag = [...eTagCss, ...eTagJs].reduce((result, item) =>
			cache.mergeEtags(result, item)
		);

		// if (this.options.generateChunksManifest) {
		// 	await this.createChunksManifestFile({ compilation, cache, eTag, manifest });
		// }
	}

	/**
	 * Get SVGs filtered by entrypoints
	 * @param {Object} options
	 * @param {Compilation} options.compilation Webpack compilation
	 * @param {String} options.entryName Entrypoint name
	 * @returns {Array<NormalModule>} Svgs list
	 */
	getFilesDependenciesByEntrypoint({
		compilation,
		entryName
	}: {
		compilation: Compilation;
		entryName: string;
	}): FilesDependencies {
		const listDependencies: FilesDependencies = {
			css: [],
			js: []
		};

		// When you use module federation you can don't have entries
		const entries = compilation.entrypoints;
		if (!entries || entries.size === 0) {
			return listDependencies;
		}

		const entry = entries.get(entryName);
		if (!entry) {
			return listDependencies;
		}

		type FilesDependenciesKey = 'css' | 'js';

		entry.getFiles().map((file) => {
			const extension = path.extname(file).slice(1) as FilesDependenciesKey;
			if (['css', 'js'].includes(extension)) {
				const asset = compilation.getAsset(file);
				asset && listDependencies[extension].push(asset);
			}
		});

		return listDependencies;
	}

	/**
	 * Get the public path from Webpack configuation
	 * and add slash at the end if necessary
	 * @param {Compilation} compilation Webpack compilation
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
			// @ts-ignore Missing pathData parameter
			publicPath = publicPath();
		}

		return publicPath;
	}

	/**
	 * Get assets data
	 * File path for the manifest
	 * HTML tags for the generated files
	 * @param {Object} options
	 * @param {TemplateFunction} options.templateFunction Template function to generate HTML tags
	 * @param {Asset} options.assets Asset module
	 * @param {String} options.entryName Entry name
	 * @param {String} options.publicPath Public path generated
	 * @returns
	 */
	getAssetData({
		templateFunction,
		assets,
		entryName,
		publicPath
	}: {
		templateFunction: TemplateFunction;
		assets: Array<Asset>;
		entryName: string;
		publicPath: string;
	}): AssetData {
		const filePath: Array<string> = [];
		const htmlTags: Array<string> = [];

		assets.forEach((asset: Asset) => {
			const filename = `${publicPath}${asset.name}`;
			const template = templateFunction(filename, entryName);

			filePath.push(filename);
			htmlTags.push(template);
		});

		return {
			filePath,
			htmlTags: htmlTags.join('')
		};
	}

	/**
	 * Create chunks manifest with Webpack compilation
	 * Expose the manifest file into the assets compilation
	 * The file is automatically created by the compiler
	 * @async
	 */
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
