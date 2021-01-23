/**
 * @license MIT
 * @name ChunksWebpackPlugin
 * @version 7.0.0
 * @author: Yoriiis aka Joris DANIEL <joris.daniel@gmail.com>
 * @description: ChunksWebpackPlugin create HTML files to serve your webpack bundles. It is very convenient with multiple entrypoints and it works without configuration.
 * {@link https://github.com/yoriiis/chunks-webpack-plugins}
 * @copyright 2021 Joris DANIEL
 **/

import { Compiler } from 'webpack';
const webpack = require('webpack');

// webpack v4/v5 compatibility:
// https://github.com/webpack/webpack/issues/11425#issuecomment-686607633
const { RawSource } = webpack.sources || require('webpack-sources');

import path = require('path');

// Describe the shape of the Chunks object
interface Chunks {
	styles: Array<string>;
	scripts: Array<string>;
}

// Describe the shape of the HtmlTags object
interface HtmlTags {
	styles: string;
	scripts: string;
}

// Describe the shape of the Manifest object
interface Manifest {
	[key: string]: {
		styles: Array<string>;
		scripts: Array<string>;
	};
}

// Describe the shape of the webpack built-in Node.js File System
interface Fs {
	mkdir: Function;
	writeFile: Function;
}

export = class ChunksWebpackPlugin {
	options: {
		outputPath: null | string;
		filename: string;
		templateStyle: string;
		templateScript: string;
		customFormatTags: boolean | ((chunksSorted: Chunks, Entrypoint: Object) => HtmlTags);
		generateChunksManifest: boolean;
		generateChunksFiles: boolean;
	};
	manifest: Manifest;
	fs!: Fs;
	compilation: any;
	isWebpack4: Boolean;
	entryNames!: Array<string>;
	publicPath!: string;
	outputPath!: null | string;
	outpathFromFilename!: string;
	/**
	 * Instanciate the constructor
	 * @param {options}
	 */
	constructor(options = {}) {
		// Merge default options with user options
		this.options = Object.assign(
			{
				filename: '[name]-[type].html',
				templateStyle: '<link rel="stylesheet" href="{{chunk}}" />',
				templateScript: '<script src="{{chunk}}"></script>',
				outputPath: null,
				customFormatTags: false,
				generateChunksManifest: false,
				generateChunksFiles: true
			},
			options
		);

		this.manifest = {};
		this.isWebpack4 = false;
		this.addAssets = this.addAssets.bind(this);
	}

	/**
	 * Apply function is automatically called by the Webpack main compiler
	 * @param {Object} compiler The Webpack compiler variable
	 */
	apply(compiler: Compiler): void {
		this.isWebpack4 = webpack.version.startsWith('4.');
		const compilerHook = this.isWebpack4 ? 'emit' : 'thisCompilation';
		compiler.hooks[compilerHook].tap('ChunksWebpackPlugin', this.hookCallback.bind(this));
	}

	/**
	 * Hook expose by the Webpack compiler
	 * @param {Object} compilation The Webpack compilation variable
	 */
	hookCallback(compilation: object): void {
		this.compilation = compilation;
		this.fs = this.compilation.compiler.outputFileSystem;

		if (this.isWebpack4) {
			this.addAssets();
		} else {
			// PROCESS_ASSETS_STAGE_ADDITIONAL: Add additional assets to the compilation
			this.compilation.hooks.processAssets.tap(
				{
					name: 'ChunksWebpackPlugin',
					stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
				},
				this.addAssets
			);
		}
	}

	/**
	 * Add assets
	 * The hook is triggered by webpack
	 */
	addAssets(): void {
		this.publicPath = this.getPublicPath();
		this.outputPath = this.getOutputPath();
		this.outpathFromFilename = this.getOutputPathFromFilename();
		this.entryNames = this.getEntryNames();

		this.entryNames
			.filter((entryName: string) => this.getFiles(entryName).length)
			.map((entryName: string) => this.processEntry(entryName));

		// Check if manifest option is enabled
		if (this.options.generateChunksManifest) {
			this.createChunksManifestFile();
		}
	}

	/**
	 * Process for each entry
	 * @param {String} entryName Entrypoint name
	 */
	processEntry(entryName: string): void {
		const files = this.getFiles(entryName);
		const chunks = this.sortsChunksByType(files);
		const Entrypoint = this.compilation.entrypoints.get(entryName);
		const htmlTags = this.getHtmlTags({ chunks, Entrypoint });

		// Check if HTML chunk files option is enabled and htmlTags valid
		if (this.options.generateChunksFiles && htmlTags) {
			this.createHtmlChunksFiles({ entryName, htmlTags });
		}

		// Check if manifest option is enabled
		if (this.options.generateChunksManifest) {
			this.updateManifest({ entryName, chunks });
		}
	}

	/**
	 * Get the public path from Webpack configuation
	 * and add slash at the end if necessary
	 * @return {String} The public path
	 */
	getPublicPath(): string {
		let publicPath = this.compilation.options.output.publicPath || '';

		// Default value for the publicPath is "auto"
		// The value must be generated automatically from the webpack compilation data
		if (publicPath === 'auto') {
			publicPath = `/${path.relative(
				this.compilation.options.context,
				this.compilation.options.output.path
			)}`;
		} else if (typeof publicPath === 'function') {
			publicPath = publicPath();
		}

		return `${publicPath}${this.isPublicPathNeedsEndingSlash(publicPath) ? '/' : ''}`;
	}

	/**
	 * Get the output path from Webpack configuation
	 * or from constructor options
	 * @return {String} The output path
	 */
	getOutputPath(): string | null {
		if (this.isValidOutputPath()) {
			return this.options.outputPath;
		} else {
			return this.compilation.options.output.path || '';
		}
	}

	/**
	 * Get the output path inside the filename if it exists
	 * Filename can contain a directory (created automatically by the compilation)
	 * @returns {String} The outpath path extract from the filename
	 */
	getOutputPathFromFilename(): string {
		const pathFromFilename = /(^\/?)(.*\/)/.exec(this.options.filename);
		return pathFromFilename && pathFromFilename[2] !== '/' ? pathFromFilename[2] : '';
	}

	/**
	 * Check if the outputPath is valid, a string and absolute
	 * @returns {Boolean} outputPath is valid
	 */
	isValidOutputPath(): boolean {
		return !!(this.options.outputPath && path.isAbsolute(this.options.outputPath));
	}

	/**
	 * Get entrypoint names from the compilation
	 * @return {Array} List of entrypoint names
	 */
	getEntryNames(): Array<string> {
		return Array.from(this.compilation.entrypoints.keys());
	}

	/**
	 * Get files list by entrypoint name
	 *
	 * @param {String} entryName Entrypoint name
	 * @return {Array} List of entrypoint names
	 */
	getFiles(entryName: string): Array<string> {
		return this.compilation.entrypoints.get(entryName).getFiles();
	}

	/**
	 * Get HTML tags from chunks
	 * @param {Object} options
	 * @param {Object} options.chunks Chunks sorted by type (style, script)
	 * @param {Object} options.Entrypoint Entrypoint object part of a single ChunkGroup
	 * @returns {String} HTML tags by entrypoints
	 */
	getHtmlTags({
		chunks,
		Entrypoint
	}: {
		chunks: Chunks;
		Entrypoint: Object;
	}): undefined | HtmlTags {
		// The user prefers to generate his own HTML tags, use his object
		if (typeof this.options.customFormatTags === 'function') {
			const htmlTags = this.options.customFormatTags(chunks, Entrypoint);

			// Check if datas are correctly formatted
			if (this.isValidCustomFormatTagsDatas(htmlTags)) {
				return htmlTags;
			} else {
				this.setError('ChunksWebpackPlugin::customFormatTags return invalid object');
			}
		} else {
			// Default behavior, generate HTML tags with templateStyle and templateScript options
			return this.formatTags(chunks);
		}
	}

	/**
	 * Sorts all chunks by type (styles or scripts)
	 * @param {Array} files List of files by entrypoint name
	 * @returns {Object} All chunks sorted by extension type
	 */
	sortsChunksByType(files: Array<string>): Chunks {
		return {
			styles: files
				.filter((file) => this.isValidExtensionByType(file, 'css'))
				.map((file) => `${this.publicPath}${file}`),
			scripts: files
				.filter((file) => this.isValidExtensionByType(file, 'js'))
				.map((file) => `${this.publicPath}${file}`)
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
	isValidExtensionByType(file: string, type: string): boolean {
		return path.extname(file).substr(1) === type;
	}

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

	/**
	 * Update the class property manifest
	 * which contains all chunks informations by entrypoint
	 * @param {Object} options
	 * @param {String} options.entryName Entrypoint name
	 * @param {Object} options.chunks List of styles and scripts chunks by entrypoint
	 */
	updateManifest({ entryName, chunks }: { entryName: string; chunks: Chunks }): void {
		this.manifest[entryName] = {
			styles: chunks.styles,
			scripts: chunks.scripts
		};
	}

	/**
	 * Create the chunks manifest file
	 * Contains all scripts and styles chunks grouped by entrypoint
	 */
	createChunksManifestFile(): void {
		// Stringify the content of the manifest
		const output = JSON.stringify(this.manifest, null, 2);

		// Expose the manifest file into the assets compilation
		// The file is automatically created by the compiler
		this.createAsset({
			filename: 'chunks-manifest.json',
			output
		});
	}

	/**
	 * Create file with HTML tags for each entrypoints
	 * @param {Object} options
	 * @param {String} options.entryName Entrypoint name
	 * @param {Object} options.htmlTags Generated HTML of script and styles tags
	 */
	createHtmlChunksFiles({
		entryName,
		htmlTags
	}: {
		entryName: string;
		htmlTags: HtmlTags;
	}): void {
		if (htmlTags.scripts.length) {
			this.createAsset({
				filename: this.options.filename
					.replace('[name]', entryName)
					.replace('[type]', 'scripts'),
				output: htmlTags.scripts
			});
		}
		if (htmlTags.styles.length) {
			this.createAsset({
				filename: this.options.filename
					.replace('[name]', entryName)
					.replace('[type]', 'styles'),
				output: htmlTags.styles
			});
		}
	}

	/**
	 * Create asset by the webpack compilation or the webpack built-in Node.js File System
	 * The outputPath parameter allows to override the default webpack output path
	 * @param {Object} options
	 * @param {String} options.filename Filename
	 * @param {String} options.output File content
	 */
	createAsset({ filename, output }: { filename: string; output: string }): void {
		if (this.options.outputPath) {
			this.fs.mkdir(
				`${this.outputPath}/${this.outpathFromFilename}`,
				{ recursive: true },
				(error: Error) => {
					if (error) throw error;

					const filePath = this.getOutputFilePath(filename);
					this.fs.writeFile(filePath, output, (error: Error) => {
						if (error) throw error;
					});
				}
			);
		} else {
			this.compilation.emitAsset(filename, new RawSource(output, false));
		}
	}

	/**
	 * Get the output file path (outPath + filename)
	 * @param {String} filename The filename
	 * @returns {String} The output file path
	 */
	getOutputFilePath(filename: string): string {
		return `${this.outputPath}${filename.substr(0, 1) === '/' ? '' : '/'}${filename}`;
	}

	/**
	 * Throw an error
	 * @param {String} message Text to display in the error
	 */
	setError(message: string) {
		throw new Error(message);
	}
};
