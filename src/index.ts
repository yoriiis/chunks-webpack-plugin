import { type Compiler, type Compilation, type Asset, sources } from 'webpack';
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
	EntryCssData,
	EntryJsData
} from './interfaces';
const webpack = require('webpack');
const schemaOptions = unTypedSchemaOptions as Schema;

class ChunksWebpackPlugin {
	options: PluginOptions;

	/**
	 * Instanciate the constructor
	 * @param {object} options Plugin options
	 */
	constructor(options: PluginOptions) {
		// Merge default options with user options
		this.options = Object.assign(
			{
				filename: '[name]-[type].html',
				templateStyle: (name: string) => `<link rel="stylesheet" href="${name}" />`,
				templateScript: (name: string) => `<script defer src="${name}"></script>`,
				generateChunksManifest: false,
				generateChunksFiles: true
			},
			options
		);

		validate(schemaOptions, this.options, {
			name: 'ChunksWebpackPlugin',
			baseDataPath: 'options'
		});

		this.hookCallback = this.hookCallback.bind(this);
	}

	/**
	 * Apply function is automatically called by the Webpack main compiler
	 * @param {Object} compiler The Webpack compiler variable
	 */
	apply(compiler: Compiler): void {
		compiler.hooks.thisCompilation.tap('ChunksWebpackPlugin', this.hookCallback);
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
		const entryCssData: Array<EntryCssData> = [];
		const entryJsData: Array<EntryJsData> = [];
		const manifest: Manifest = {};

		await Promise.all(
			Array.from(entryNames).map(async (entryName: string) => {
				const filesDependencies = this.getFilesDependenciesByEntrypoint({
					compilation,
					entryName
				});

				manifest[entryName] = {
					styles: [],
					scripts: []
				};
				const publicPath = this.getPublicPath(compilation);

				if (filesDependencies.css.length) {
					const eTag = filesDependencies.css
						.map((item: Asset) =>
							cache.getLazyHashedEtag(item.source as sources.Source)
						)
						.reduce((result, item) => cache.mergeEtags(result, item));

					const cacheItem = cache.getItemCache(`CSS|${entryName}`, eTag);

					let output: EntryCache = await cacheItem.getPromise();
					if (!output) {
						const { htmlTags, filePath } = this.getAssetData({
							templateFunction: this.options.templateStyle,
							assets: filesDependencies.css,
							entryName,
							publicPath
						});

						output = {
							source: new RawSource(htmlTags, false),
							filePath,
							htmlTags,
							filename: this.options.filename
								.replace('[name]', entryName)
								.replace('[type]', 'styles')
						};

						await cacheItem.storePromise(output);
					}

					compilation.emitAsset(output.filename, output.source);

					entryCssData.push({
						entryName,
						source: output.source
					});
					manifest[entryName].styles = output.filePath;
				}

				if (filesDependencies.js.length) {
					const eTag = filesDependencies.js
						.map((item: Asset) =>
							cache.getLazyHashedEtag(item.source as sources.Source)
						)
						.reduce((result, item) => cache.mergeEtags(result, item));

					const cacheItem = cache.getItemCache(`js|${entryName}`, eTag);

					let output: EntryCache = await cacheItem.getPromise();
					if (!output) {
						const { htmlTags, filePath } = this.getAssetData({
							templateFunction: this.options.templateScript,
							assets: filesDependencies.js,
							entryName,
							publicPath
						});

						output = {
							source: new RawSource(htmlTags, false),
							filePath,
							htmlTags,
							filename: this.options.filename
								.replace('[name]', entryName)
								.replace('[type]', 'scripts')
						};

						await cacheItem.storePromise(output);
					}

					compilation.emitAsset(output.filename, output.source);

					entryJsData.push({
						entryName,
						source: output.source
					});
					manifest[entryName].scripts = output.filePath;
				}
			})
		);

		if (!this.options.generateChunksManifest || (!entryCssData.length && !entryJsData.length)) {
			return;
		}

		// Need to sort (**always**), to have deterministic build
		const eTagCss = entryCssData
			.sort((a, b) => a.entryName.localeCompare(b.entryName))
			.map((item) => cache.getLazyHashedEtag(item.source));

		const eTagJs = entryJsData
			.sort((a, b) => a.entryName.localeCompare(b.entryName))
			.map((item) => cache.getLazyHashedEtag(item.source));

		const eTagCssJs = [];
		eTagCss && eTagCssJs.push(...eTagCss);
		eTagJs && eTagCssJs.push(...eTagJs);

		if (eTagCssJs.length) {
			const eTag = eTagCssJs.reduce((result, item) => cache.mergeEtags(result, item));

			await this.createChunksManifestFile({ compilation, cache, eTag, manifest });
		}
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
		entry.getFiles().forEach((file: string) => {
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
