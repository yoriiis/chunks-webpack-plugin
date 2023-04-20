import {
	type Compiler,
	type Compilation,
	type NormalModule,
	type Chunk,
	type Module,
	type sources
} from 'webpack';
import path = require('path');
import { validate } from 'schema-utils';
import { Schema } from 'schema-utils/declarations/validate';
import unTypedSchemaOptions from './schemas/plugin-options.json';
import { Chunks, HtmlTags, Manifest, Fs, PluginOptions } from './interfaces';
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
				templateStyle: '<link rel="stylesheet" href="{{chunk}}" />',
				templateScript: '<script src="{{chunk}}"></script>',
				customFormatTags: false,
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
				const files = this.getFilesDependenciesByEntrypoint({
					compilation,
					entryName
				});

				// console.log({ entryName, files });
				// debugger;

				// For empty chunks
				if (!files.length) {
					return;
				}

				const eTag = files.map((item: any) =>
					cache.getLazyHashedEtag(item.source as sources.Source)
				);
				const cacheItem = cache.getItemCache(entryName, eTag);

				let output: any = await cacheItem.getPromise();
				if (!output) {
					const chunks = this.sortsChunksByType({ publicPath, files });
					console.log({ chunks });
					const htmlTags = this.getHtmlTags({
						chunks,
						Entrypoint: compilation.entrypoints.get(entryName)
					});
					// const source = new RawSource(JSON.stringify(htmlTags), false);
					console.log(entryName, htmlTags.styles);
					output = {
						styles: {
							source: new RawSource(htmlTags.styles, false),
							chunks: chunks.styles,
							htmlTags: htmlTags.styles,
							filename: this.options.filename
								.replace('[name]', entryName)
								.replace('[type]', 'styles')
						},
						scripts: {
							source: new RawSource(htmlTags.scripts, false),
							chunks: chunks.scripts,
							htmlTags: htmlTags.scripts,
							filename: this.options.filename
								.replace('[name]', entryName)
								.replace('[type]', 'scripts')
						}
						// chunks,
						// htmlTags,
						// filename: {
						// 	style: this.options.filename
						// 		.replace('[name]', entryName)
						// 		.replace('[type]', 'styles'),
						// 	scripts: this.options.filename
						// 		.replace('[name]', entryName)
						// 		.replace('[type]', 'scripts')
						// }
					};

					await cacheItem.storePromise(output);
				}

				if (output.styles.htmlTags) {
					compilation.emitAsset(output.styles.filename, output.styles.source);
				}

				if (output.scripts.htmlTags) {
					compilation.emitAsset(output.scripts.filename, output.scripts.source);
				}

				customData.push({
					entryName,
					styles: output.styles,
					scripts: output.scripts
					// htmlTags: output.htmlTags
				});
				manifest[entryName] = {
					styles: output.styles.chunks,
					scripts: output.scripts.chunks
				};
			})
		);

		if (!customData.length) {
			return;
		}

		// Need to sort (**always**), to have deterministic build
		const eTag = customData
			.sort((a, b) => a.entryName.localeCompare(b.entryName))
			.map((item) => cache.getLazyHashedEtag(item.source))
			.reduce((result, item) => cache.mergeEtags(result, item));

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
	}): Array<any> {
		// When you use module federation you can don't have entries
		const entries = compilation.entrypoints;
		if (!entries || entries.size === 0) {
			return [];
		}

		const entry = entries.get(entryName);
		if (!entry) {
			return [];
		}

		return entry.getFiles().map((file) => {
			return compilation.getAsset(file);
		});
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
		// if (publicPath === 'auto') {
		// 	publicPath = `/${path.relative(
		// 		compilation.options.context || '',
		// 		compilation.options.output.path
		// 	)}`;
		// } else if (typeof publicPath === 'function') {
		// 	publicPath = publicPath();
		// }

		return '';
		// return `${publicPath}${this.isPublicPathNeedsEndingSlash(publicPath) ? '/' : ''}`;
	}

	/**
	 * Get the path inside a string if it exists
	 * Filename can contain a directory
	 * @returns {String} The outpath path extract from the filename
	 */
	getPathFromString(filename: string): string {
		const path = /(^\/?)(.*\/)(.*)$/.exec(filename);
		return path && path[2] !== '/' ? path[2] : '';
	}

	/**
	 * Get HTML tags from chunks
	 * @param {Object} options
	 * @param {Object} options.chunks Chunks sorted by type (style, script)
	 * @param {Object} options.Entrypoint Entrypoint object part of a single ChunkGroup
	 * @returns {String} HTML tags by entrypoints
	 */
	getHtmlTags({ chunks, Entrypoint }: { chunks: Chunks; Entrypoint: any }): HtmlTags {
		// The user prefers to generate his own HTML tags, use his object
		// if (typeof this.options.customFormatTags === 'function') {
		// 	const htmlTags = this.options.customFormatTags(chunks, Entrypoint);

		// 	// Check if datas are correctly formatted
		// 	if (this.isValidCustomFormatTagsDatas(htmlTags)) {
		// 		return htmlTags;
		// 	} else {
		// 		// this.setError('ChunksWebpackPlugin::customFormatTags return invalid object');
		// 	}
		// } else {
		// Default behavior, generate HTML tags with templateStyle and templateScript options
		return this.formatTags(chunks);
		// }
	}

	/**
	 * Sorts all chunks by type (styles or scripts)
	 * @param {Array} files List of files by entrypoint name
	 * @returns {Object} All chunks sorted by extension type
	 */
	sortsChunksByType({ publicPath, files }: { publicPath: string; files: Array<any> }): Chunks {
		// let filename = compilation.getPath(this.options.filename, {
		// 	filename: entryName
		// });

		return {
			styles: files
				.filter(({ name }) => path.extname(name).substr(1) === 'css')
				.map(({ name }) => `${publicPath}${name}`),
			scripts: files
				.filter(({ name }) => path.extname(name).substr(1) === 'js')
				.map(({ name }) => `${publicPath}${name}`)
		};
	}

	/**
	 * Generate HTML styles and scripts tags for each entrypoints
	 * @param {Object} chunks The list of chunks of chunkGroups sorted by type
	 * @returns {Object} HTML tags with all assets for an entrypoint and sorted by type
	 */
	formatTags(chunks: Chunks): HtmlTags {
		return {
			styles: chunks.styles
				.map((chunkCSS: string) =>
					this.options.templateStyle.replace('{{chunk}}', chunkCSS)
				)
				.join(''),
			scripts: chunks.scripts
				.map((chunkJS: string) => this.options.templateScript.replace('{{chunk}}', chunkJS))
				.join('')
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

	/**
	 * Check if file extension correspond to the type parameter
	 * @param {String} file File path
	 * @param {String} type File extension
	 * @returns {Boolean} File extension is valid
	 */
	// isValidExtensionByType(file: string, type: string): boolean {
	// 	return path.extname(file).substr(1) === type;
	// }

	/**
	 * Check if datas from customFormatTags are valid
	 * @param {Object} htmlTags Formatted HTML tags by styles and scripts keys
	 */
	isValidCustomFormatTagsDatas(htmlTags: HtmlTags): boolean {
		return (
			htmlTags !== null &&
			typeof htmlTags.styles !== 'undefined' &&
			typeof htmlTags.scripts !== 'undefined'
		);
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
