/**
 * @license MIT
 * @name ChunksWebpackPlugin
 * @version 6.0.1
 * @author: Yoriiis aka Joris DANIEL <joris.daniel@gmail.com>
 * @description: ChunksWebpackPlugin create HTML files to serve your webpack bundles. It is very convenient with multiple entrypoints and it works without configuration.
 * {@link https://github.com/yoriiis/chunks-webpack-plugins}
 * @copyright 2020 Joris DANIEL
 **/

import { Compiler } from 'webpack';
import utils = require('./utils');

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

export = class ChunksWebpackPlugin {
	options: {
		outputPath: null | string;
		fileExtension: string;
		templateStyle: string;
		templateScript: string;
		customFormatTags: boolean | ((chunksSorted: Chunks, files: Array<string>) => HtmlTags);
		generateChunksManifest: boolean;
		generateChunksFiles: boolean;
	};
	manifest: Manifest;
	compilation: any;
	entryNames!: Array<string>;
	publicPath!: string;
	outputPath!: null | string;
	/**
	 * Instanciate the constructor
	 * @param {options}
	 */
	constructor(options = {}) {
		// Merge default options with user options
		this.options = Object.assign(
			{
				outputPath: null,
				fileExtension: '.html',
				templateStyle: '<link rel="stylesheet" href="{{chunk}}" />',
				templateScript: '<script src="{{chunk}}"></script>',
				customFormatTags: false,
				generateChunksManifest: false,
				generateChunksFiles: true
			},
			options
		);

		this.manifest = {};
	}

	/**
	 * Apply function is automatically called by the Webpack main compiler
	 *
	 * @param {Object} compiler The Webpack compiler variable
	 */
	apply(compiler: Compiler): void {
		compiler.hooks.emit.tap('ChunksWebpackPlugin', this.hookCallback.bind(this));
	}

	/**
	 * Hook expose by the Webpack compiler
	 *
	 * @param {Object} compilation The Webpack compilation variable
	 */
	hookCallback(compilation: object): void {
		this.compilation = compilation;
		this.publicPath = this.getPublicPath();
		this.outputPath = this.getOutputPath();
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
		const htmlTags = this.getHtmlTags({ chunks, files });

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
	 *
	 * @return {String} The public path
	 */
	getPublicPath(): string {
		const publicPath = this.compilation.options.output.publicPath || '';
		return `${publicPath}${this.isPublicPathNeedsEndingSlash(publicPath) ? '/' : ''}`;
	}

	/**
	 * Get the output path from Webpack configuation
	 * or from constructor options
	 *
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
	 * Get entrypoint names from the compilation
	 *
	 * @return {Array} List of entrypoint names
	 */
	getEntryNames(): Array<string> {
		return Array.from(this.compilation.entrypoints.keys());
	}

	/**
	 * Get files list by entrypoint name
	 *
	 * @param {String} entryName Entrypoint name
	 *
	 * @return {Array} List of entrypoint names
	 */
	getFiles(entryName: string): Array<string> {
		return this.compilation.entrypoints.get(entryName).getFiles();
	}

	/**
	 * Get HTML tags from chunks
	 *
	 * @param {Object} chunks Chunks sorted by type (style, script)
	 * @param {Array} files List of files associated by entrypoints
	 *
	 * @returns {String} HTML tags by entrypoints
	 */
	getHtmlTags({ chunks, files }: { chunks: Chunks; files: Array<string> }): undefined | HtmlTags {
		// The user prefers to generate his own HTML tags, use his object
		if (typeof this.options.customFormatTags === 'function') {
			const htmlTags = this.options.customFormatTags(chunks, files);

			// Check if datas are correctly formatted
			if (this.isValidCustomFormatTagsDatas(htmlTags)) {
				return htmlTags;
			} else {
				utils.setError('ChunksWebpackPlugin::customFormatTags return invalid object');
			}
		} else {
			// Default behavior, generate HTML tags with templateStyle and templateScript options
			return this.formatTags(chunks);
		}
	}

	/**
	 * Sorts all chunks by type (styles or scripts)
	 *
	 * @param {Array} files List of files by entrypoint name
	 *
	 * @returns {Object} All chunks sorted by extension type
	 */
	sortsChunksByType(files: Array<string>): Chunks {
		return {
			styles: files
				.filter(file => this.isValidExtensionByType(file, 'css'))
				.map(file => `${this.publicPath}${file}`),
			scripts: files
				.filter(file => this.isValidExtensionByType(file, 'js'))
				.map(file => `${this.publicPath}${file}`)
		};
	}

	/**
	 * Generate HTML styles and scripts tags for each entrypoints
	 *
	 * @param {Object} chunks The list of chunks of chunkGroups sorted by type
	 *
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
	 *
	 * @param {String} publicPath Public path
	 *
	 * @returns {Boolean} The public path need an ending slash
	 */
	isPublicPathNeedsEndingSlash(publicPath: string): boolean {
		return !!(publicPath && publicPath.substr(-1) !== '/');
	}

	/**
	 * Check if the outputPath is valid, a string and absolute
	 *
	 * @returns {Boolean} outputPath is valid
	 */
	isValidOutputPath(): boolean {
		return !!(this.options.outputPath && utils.isAbsolutePath(this.options.outputPath));
	}

	/**
	 * Check if file extension correspond to the type parameter
	 *
	 * @param {String} file File path
	 * @param {String} type File extension
	 *
	 * @returns {Boolean} File extension is valid
	 */
	isValidExtensionByType(file: string, type: string): boolean {
		return utils.getFileExtension(file) === type;
	}

	/**
	 * Check if datas from customFormatTags are valid
	 *
	 * @param {Object} htmlTags Formatted HTML tags by styles and scripts keys
	 */
	isValidCustomFormatTagsDatas(htmlTags: HtmlTags): boolean {
		return (
			htmlTags !== null &&
			typeof htmlTags.styles !== 'undefined' &&
			typeof htmlTags.scripts !== 'undefined' &&
			htmlTags.styles !== '' &&
			htmlTags.scripts !== ''
		);
	}

	/**
	 * Update the class property manifest
	 * which contains all chunks informations by entrypoint
	 *
	 * @param {String} entryName Entrypoint name
	 * @param {Object} chunks List of styles and scripts chunks by entrypoint
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
		this.compilation.assets['chunks-manifest.json'] = {
			source: () => output,
			size: () => output.length
		};
	}

	/**
	 * Create file with HTML tags for each entrypoints
	 *
	 * @param {String} entryName Entrypoint name
	 * @param {Object} htmlTags Generated HTML of script and styles tags
	 */
	createHtmlChunksFiles({
		entryName,
		htmlTags
	}: {
		entryName: string;
		htmlTags: HtmlTags;
	}): void {
		if (htmlTags.scripts.length) {
			utils.writeFile({
				outputPath: `${this.outputPath}/${entryName}-scripts${this.options.fileExtension}`,
				output: htmlTags.scripts
			});
		}
		if (htmlTags.styles.length) {
			utils.writeFile({
				outputPath: `${this.outputPath}/${entryName}-styles${this.options.fileExtension}`,
				output: htmlTags.styles
			});
		}
	}
};
