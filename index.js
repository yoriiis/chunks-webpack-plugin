/**
 * @license MIT
 * @name ChunksWebpackPlugin
 * @version 1.0.1
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
			path: null,
			fileExtension: '.html',
			templateStyle: `<link rel="stylesheet" href="{{chunk}}"/>`,
			templateScript: `<script src="{{chunk}}"></script>`
		};
		this.options = Object.assign(defaultOptions, userOptions);
	}

	/**
	 * apply function is automatically called by the Webpack main compiler
	 * @param {Object} compiler
	 */
	apply(compiler) {
		compiler.hooks.done.tap('compilerDone', this._done.bind(this));
	}

	/**
	 * Hook expose by the Webpack compiler
	 * @param {Object} compilation
	 */
	_done(compilation) {
		this.publicPath = compilation.compilation.mainTemplate.getPublicPath({
			hash: compilation.hash
		});

		if (this.options.path === null) {
			this.path = compilation.compilation.options.output.path;
		} else if (this.options.path !== '' && path.isAbsolute(this.options.path)) {
			this.path = this.options.path;
		} else {
			throw new Error('ChunksWebpackPlugin::path must be absolute');
		}

		if (compilation.compilation.chunkGroups.length) {
			this.checkDestinationFolder();
		}

		compilation.compilation.chunkGroups.forEach(chunkGroup => {
			let tags = this.generateTags({
				chunks: chunkGroup.chunks
			});
			this.createFiles({
				htmlScripts: tags.htmlScripts,
				htmlStyles: tags.htmlStyles,
				entry: chunkGroup.options.name
			});
		})
	}

	/**
	 * Generate HTML styles and scripts tags for each entrypoints
	 * @param {Array} chunks The list of chunks of chunkGroups
	 * @returns {Object} HTML tags with all assets chunks
	 */
	generateTags({
		chunks
	}) {
		let htmlScripts = '';
		let htmlStyles = '';

		chunks.forEach(chunk => {
			chunk.files.forEach(file => {
				if (this.getFileExtension(file) === 'css') {
					htmlStyles += this.options.templateStyle.replace('{{chunk}}', `${this.publicPath}${file}`);
				} else if (this.getFileExtension(file) === 'js') {
					htmlScripts += this.options.templateScript.replace('{{chunk}}', `${this.publicPath}${file}`);
				}
			})
		})

		return {
			htmlStyles,
			htmlScripts
		}
	}

	/**
	 * Create file with HTML tags for each entrypoints
	 * @param {String} htmlScripts HTML script tag with all assets chunks
	 * @param {String} htmlStyles HTML styles tag with all assets chunks
	 * @param {String} entry The name of the entrypoint
	 */
	createFiles({
		htmlStyles,
		htmlScripts,
		entry
	}) {
		fs.writeFileSync(`${this.path}/${entry}-scripts${this.options.fileExtension}`, htmlScripts);
		fs.writeFileSync(`${this.path}/${entry}-styles${this.options.fileExtension}`, htmlStyles);
	}

	/**
	 * Check if the destination folder is available
	 */
	checkDestinationFolder() {
		if (!fs.existsSync(this.path)) {
			fs.mkdirSync(this.path);
		}
	}

	/**
	 * Get the file extension of a file path
	 */
	getFileExtension(file) {
		return file.substr(file.lastIndexOf('.') + 1, file.length);
	}
}