/**
 * @license MIT
 * @name ChunksWebpackPlugin
 * @version 2.0.2
 * @author: Yoriiis aka Joris DANIEL <joris.daniel@gmail.com>
 * @description:
 * {@link https://github.com/yoriiis/chunks-webpack-plugins}
 * @copyright 2019 Joris DANIEL
 **/

const fs = require('fs');
const path = require('path');

module.exports = class ChunksWebpackPlugin {
	/**
	 * @param {options}
	 */
	constructor(options) {

		const userOptions = options || {};
		const defaultOptions = {
			outputPath: null,
			fileExtension: '.html',
			templateStyle: `<link rel="stylesheet" href="{{chunk}}" />`,
			templateScript: `<script src="{{chunk}}"></script>`,
			customFormatTags: null
		};

		// Merge default options with user options
		this.options = Object.assign(defaultOptions, userOptions);

	}

	/**
	 * apply function is automatically called by the Webpack main compiler
	 * @param {Object} compiler The Webpack compiler variable
	 */
	apply(compiler) {
		compiler.hooks.done.tap('compilerDone', this._done.bind(this));
	}

	/**
	 * Hook expose by the Webpack compiler
	 * @param {Object} compilation The Webpack compilation variable
	 */
	_done(compilation) {

		// Get publicPath from Webpack and add slashes suffix if necessary
		this.publicPath = compilation.compilation.options.output.publicPath;
		if (this.publicPath) {
			if (this.publicPath.substr(-1) !== '/') {
				this.publicPath = `${this.publicPath}/`
			}
		}

		// Use default Webpack outputPath
		if (this.options.outputPath === null) {
			this.outputPath = compilation.compilation.options.output.path;
		} else if (this.options.outputPath !== '' && path.isAbsolute(this.options.outputPath)) {
			// Use custom outputPath (must be absolute)
			this.outputPath = this.options.outputPath;
		} else {
			throw new Error('ChunksWebpackPlugin::outputPath is incorrect');
		}

		// Check if destination folder is available
		if (compilation.compilation.chunkGroups.length) {
			this.checkDestinationFolder();
		}

		compilation.compilation.chunkGroups.forEach(chunkGroup => {

			// Check if chunkGroup contains chunks
			if (chunkGroup.chunks.length) {
				let chunksSorted = this.sortsChunksByType(chunkGroup.chunks);
				let tagsHTML = null;

				// The user prefers to generate his own HTML tags, use his object
				if (typeof this.options.customFormatTags === 'function') {

					// Change context of the function, to allow access to this class
					tagsHTML = this.options.customFormatTags.call(this, chunksSorted, chunkGroup);

					// Check if datas are correctly formatted
					if (tagsHTML === null || typeof tagsHTML.styles === 'undefined' || typeof tagsHTML.scripts === 'undefined') {
						throw new Error('ChunksWebpackPlugin::customFormatTags return incorrect object');
					}

				} else {
					// Default behavior, generate HTML tags with templateStyle and templateScript
					tagsHTML = this.generateTags(chunksSorted);
				}

				this.createFiles({
					htmlStyles: chunksSorted.styles.length ? tagsHTML.styles : false,
					htmlScripts: chunksSorted.scripts.length ? tagsHTML.scripts : false,
					entry: chunkGroup.options.name
				});
			}
		})

	}

	/**
	 * Sorts all chunks by type (styles or scripts)
	 * @param {Array} chunks The list of chunks of chunkGroups
	 * @returns {Object} files All chunks sorted by type (extension)
	 */
	sortsChunksByType(chunks) {

		let files = {
			'styles': [],
			'scripts': []
		};

		chunks.forEach(chunk => {
			chunk.files.forEach(file => {
				if (this.getFileExtension(file) === 'css') {
					files['styles'].push(`${this.publicPath}${file}`);
				} else if (this.getFileExtension(file) === 'js') {
					files['scripts'].push(`${this.publicPath}${file}`);
				}
			})
		});

		return files;

	}

	/**
	 * Generate HTML styles and scripts tags for each entrypoints
	 * @param {Object} chunksSorted The list of chunks of chunkGroups sorted by type
	 * @returns {Object} html HTML tags with all assets chunks
	 */
	generateTags(chunksSorted) {

		let html = {
			'styles': '',
			'scripts': ''
		}

		chunksSorted['styles'].forEach(chunkCSS => {
			html['styles'] += this.options.templateStyle.replace('{{chunk}}', chunkCSS);
		});

		chunksSorted['scripts'].forEach(chunkJS => {
			html['scripts'] += this.options.templateScript.replace('{{chunk}}', chunkJS);
		});

		return html
	}

	/**
	 * Create file with HTML tags for each entrypoints
	 * @param {String} htmlScripts HTML script tag with all assets chunks
	 * @param {String} htmlStyles HTML styles tag with all assets chunks
	 * @param {String} entry The name of the entrypoint
	 */
	createFiles({
		htmlStyles = false,
		htmlScripts = false,
		entry
	}) {
		if (htmlScripts) {
			fs.writeFileSync(`${this.outputPath}/${entry}-scripts${this.options.fileExtension}`, htmlScripts);
		}
		if (htmlStyles) {
			fs.writeFileSync(`${this.outputPath}/${entry}-styles${this.options.fileExtension}`, htmlStyles);
		}
	}

	/**
	 * Check if the destination folder is available
	 */
	checkDestinationFolder() {
		if (!fs.existsSync(this.outputPath)) {
			fs.mkdirSync(this.outputPath);
		}
	}

	/**
	 * Get the file extension of a file path
	 * @param {String} file The path of the chunk filename
	 * @returns {String} Extension of the filename
	 */
	getFileExtension(file) {
		return file.substr(file.lastIndexOf('.') + 1, file.length);
	}
}