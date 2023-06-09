import webpack, { sources } from 'webpack';
import path from 'path';
import { validate } from 'schema-utils';
import unTypedSchemaOptions from './schemas/plugin-options.json';
import type { Compiler, Compilation, Asset } from 'webpack';
import { Schema } from 'schema-utils/declarations/validate';
import {
	FilesDependencies,
	Manifest,
	PluginOptions,
	AssetData,
	TemplateFunction,
	EntryCache,
	EntryCssData,
	EntryJsData,
	PublicPath
} from './types';
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
	 * @param {Compiler} compiler The Webpack compiler variable
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
		const entryCssData: EntryCssData[] = [];
		const entryJsData: EntryJsData[] = [];
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
				const publicPath = this.getPublicPath(compilation, entryName);

				if (filesDependencies.css.length) {
					const eTag = filesDependencies.css
						.map((item: Asset) =>
							cache.getLazyHashedEtag(item.source as sources.Source)
						)
						.reduce((result, item) => cache.mergeEtags(result, item));

					const cacheItem = cache.getItemCache(`css|${entryName}`, eTag);

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
	 * @param {string} options.entryName Entrypoint name
	 * @returns {NormalModule[]} Svgs list
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
	 * @return {string} The public path
	 */
	getPublicPath(compilation: Compilation, entryName: string): PublicPath {
		const webpackPublicPath = compilation.getAssetPath(
			compilation.outputOptions.publicPath || '',
			{}
		);

		if (webpackPublicPath === 'auto') {
			const outputPath = compilation.options.output.path || '';
			const filenameDirname = path.dirname(this.options.filename);
			const entryDirname = path.dirname(entryName);
			let pathHtml = path.relative(
				`${outputPath}/${filenameDirname}/${entryDirname}`,
				`${outputPath}`
			);

			if (pathHtml && !pathHtml.endsWith('/')) {
				pathHtml += '/';
			}

			return {
				html: pathHtml,
				manifest: ''
			};
		}

		return {
			html: webpackPublicPath,
			manifest: webpackPublicPath
		};
	}

	/**
	 * Get assets data
	 * File path for the manifest
	 * HTML tags for the generated files
	 * @param {Object} options
	 * @param {TemplateFunction} options.templateFunction Template function to generate HTML tags
	 * @param {Asset} options.assets Asset module
	 * @param {string} options.entryName Entry name
	 * @param {string} options.publicPath Public path generated
	 * @returns
	 */
	getAssetData({
		templateFunction,
		assets,
		entryName,
		publicPath
	}: {
		templateFunction: TemplateFunction;
		assets: Asset[];
		entryName: string;
		publicPath: PublicPath;
	}): AssetData {
		const filePath: string[] = [];
		const htmlTags: string[] = [];

		assets.forEach((asset: Asset) => {
			filePath.push(`${publicPath.manifest}${asset.name}`);
			htmlTags.push(templateFunction(`${publicPath.html}${asset.name}`, entryName));
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
	 * @param {Object} options
	 * @param {Compilation} options.compilation Webpack compilation
	 * @param {any} options.cache Webpack cache
	 * @param {unknown} options.eTag Webpack eTag
	 * @param {Manifest} options.manifest Manifest
	 * @returns {String} Sprite filename
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
