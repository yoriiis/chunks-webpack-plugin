/**
 * @license MIT
 * @name ChunksWebpackPlugin
 * @version 4.0.3
 * @author: Yoriiis aka Joris DANIEL <joris.daniel@gmail.com>
 * @description: ChunksWebpackPlugin create HTML files to serve your webpack bundles. It is very convenient with multiple entrypoints and it works without configuration.
 * {@link https://github.com/yoriiis/chunks-webpack-plugins}
 * @copyright 2020 Joris DANIEL
 **/

const utils = require('./utils');

module.exports = class ChunksWebpackPlugin {
	/**
	 * Instanciate the constructor
	 * @param {options}
	 */
	constructor (options = {}) {
		// Merge default options with user options
		this.options = Object.assign(
			{
				outputPath: 'default',
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
	apply (compiler) {
		compiler.hooks.emit.tap('ChunksWebpackPlugin', this.hookCallback.bind(this));
	}

	/**
	 * Hook expose by the Webpack compiler
	 *
	 * @param {Object} compilation The Webpack compilation variable
	 */
	hookCallback (compilation) {
		this.compilation = compilation;
		this.publicPath = this.getPublicPath();
		this.outputPath = this.getOutputPath();
		this.entryNames = this.getEntryNames();

		this.entryNames
			.filter(entryName => this.getFiles(entryName).length)
			.map(entryName => this.processEntry(entryName));

		// Check if manifest option is enabled
		if (this.options.generateChunksManifest) {
			this.createChunksManifestFile();
		}
	}

	processEntry (entryName) {
		const files = this.getFiles(entryName);
		const chunks = this.sortsChunksByType(files);
		const htmlTags = this.getHtmlTags({ chunks, files });

		// Check if html chunk files option is enabled
		if (this.options.generateChunksFiles) {
			this.createHtmlChunksFiles({ entryName, htmlTags });
		}

		// Check if manifest option is enabled
		if (this.options.generateChunksManifest) {
			this.updateManifest({ entryName, chunks });
		}
	}

	/**
	 * Get HTML tags from chunks
	 *
	 * @param {Object} chunks Chunks sorted by type (style, script)
	 * @param {Array} files List of files associated by entrypoints
	 *
	 * @returns {String} HTML tags by entrypoints
	 */
	getHtmlTags ({ chunks, files }) {
		// The user prefers to generate his own HTML tags, use his object
		if (this.hasCustomFormatTags()) {
			const htmlTags = this.options.customFormatTags(chunks, files);

			// Check if datas are correctly formatted
			if (this.isValidCustomFormatTagsDatas(htmlTags)) {
				return htmlTags;
			} else {
				utils.setError('ChunksWebpackPlugin::customFormatTags return invalid object');
			}
		} else {
			// Default behavior, generate HTML tags with templateStyle and templateScript
			return this.generateTags(chunks);
		}
	}

	/**
	 * Check if the constructor has a customFormatTags function
	 *
	 * @returns {Boolean} The constructor has a customFormatTags function
	 */
	hasCustomFormatTags () {
		return this.options.customFormatTags instanceof Function;
	}

	/**
	 * Get the public path from Webpack configuation
	 * and add slash at the end if necessary
	 *
	 * @return {String} The public path
	 */
	getPublicPath () {
		const publicPath = this.compilation.options.output.publicPath || '';
		return `${publicPath}${this.publicPathNeedEndingSlash(publicPath) ? '/' : ''}`;
	}

	/**
	 * Check if the publicPath need an ending slash
	 *
	 * @param {String} publicPath Public path
	 *
	 * @returns {Boolean} The public path need an ending slash
	 */
	publicPathNeedEndingSlash (publicPath) {
		return publicPath && publicPath.substr(-1) !== '/';
	}

	/**
	 * Get the output path from Webpack configuation
	 * or from constructor options
	 *
	 * @return {String} The output path
	 */
	getOutputPath () {
		if (this.isDefaultOutputPath()) {
			return this.compilation.options.output.path || '';
		} else if (this.isValidOutputPath()) {
			return this.options.outputPath;
		} else {
			utils.setError('ChunksWebpackPlugin::outputPath option is invalid');
		}
	}

	/**
	 * Check if the outputPath from options has default value
	 *
	 * @returns {Boolean} outputPath is default
	 */
	isDefaultOutputPath () {
		return this.options.outputPath === 'default';
	}

	/**
	 * Check if the outputPath is valid, a string and absolute
	 *
	 * @returns {Boolean} outputPath is valid
	 */
	isValidOutputPath () {
		return this.options.outputPath && utils.isAbsolutePath(this.options.outputPath);
	}

	/**
	 * Get entrypoint names from the compilation
	 *
	 * @return {Array} List of entrypoint names
	 */
	getEntryNames () {
		return Array.from(this.compilation.entrypoints.keys());
	}

	/**
	 * Get files list by entrypoint name
	 *
	 * @param {String} entryName Entrypoint name
	 *
	 * @return {Array} List of entrypoint names
	 */
	getFiles (entryName) {
		return this.compilation.entrypoints.get(entryName).getFiles();
	}

	/**
	 * Sorts all chunks by type (styles or scripts)
	 *
	 * @param {Array} files List of files by entrypoint name
	 *
	 * @returns {Object} files All chunks sorted by type (extension)
	 */
	sortsChunksByType (files) {
		return {
			styles: files.filter(file => this.isValidExtensionByType(file, 'css')),
			scripts: files.filter(file => this.isValidExtensionByType(file, 'js'))
		};
	}

	/**
	 * Check if file extension correspond to the type parameter
	 *
	 * @param {String} file File path
	 * @param {String} type File extension
	 *
	 * @returns {Boolean} File extension is valid
	 */
	isValidExtensionByType (file, type) {
		return utils.getFileExtension(file) === type;
	}

	/**
	 * Check if datas from customFormatTags are valid
	 *
	 * @param {Object} htmlTags Formatted HTML tags by styles and scripts keys
	 */
	isValidCustomFormatTagsDatas (htmlTags) {
		return (
			htmlTags !== null &&
			typeof htmlTags.styles !== 'undefined' &&
			typeof htmlTags.scripts !== 'undefined' &&
			htmlTags.styles !== '' &&
			htmlTags.scripts !== ''
		);
	}

	/**
	 * Generate HTML styles and scripts tags for each entrypoints
	 *
	 * @param {Object} chunks The list of chunks of chunkGroups sorted by type
	 *
	 * @returns {Object} html HTML tags with all assets chunks
	 */
	generateTags (chunks) {
		return {
			styles: chunks.styles.map(chunkCSS =>
				this.options.templateStyle.replace('{{chunk}}', chunkCSS)
			),
			scripts: chunks.scripts.map(chunkJS =>
				this.options.templateScript.replace('{{chunk}}', chunkJS)
			)
		};
	}

	/**
	 * Create file with HTML tags for each entrypoints
	 *
	 * @param {String} entryName Entrypoint name
	 * @param {Object} htmlTags Generated HTML of script and styles tags
	 */
	createHtmlChunksFiles ({ entryName, htmlTags }) {
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

	/**
	 * Update the class property manifest
	 * which contains all chunks informations by entrypoint
	 *
	 * @param {String} entryName Entrypoint name
	 * @param {Object} chunks List of styles and scripts chunks by entrypoint
	 */
	updateManifest ({ entryName, chunks }) {
		this.manifest[entryName] = {
			styles: chunks.styles,
			scripts: chunks.scripts
		};
	}

	/**
	 * Create the chunks manifest file
	 * Contains all scripts and styles chunks grouped by entrypoint
	 */
	createChunksManifestFile () {
		// Stringify the content of the manifest
		const output = JSON.stringify(this.manifest, null, 2);

		// Expose the manifest file into the assets compilation
		// The file is automatically created by the compiler
		this.compilation.assets['chunks-manifest.json'] = {
			source: () => output,
			size: () => output.length
		};
	}
};
