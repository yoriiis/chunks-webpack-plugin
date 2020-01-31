/**
 * @license MIT
 * @name ChunksWebpackPlugin
 * @version 4.0.0
 * @author: Yoriiis aka Joris DANIEL <joris.daniel@gmail.com>
 * @description: Easily create HTML files with all chunks by entrypoint (based on Webpack chunkGroups)
 * {@link https://github.com/yoriiis/chunks-webpack-plugins}
 * @copyright 2020 Joris DANIEL
 **/

const utils = require('./utils')

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
		)
		this.manifest = {}
	}

	/**
	 * Apply function is automatically called by the Webpack main compiler
	 *
	 * @param {Object} compiler The Webpack compiler variable
	 */
	apply (compiler) {
		compiler.hooks.emit.tap('ChunksWebpackPlugin', this.hookCallback.bind(this))
	}

	/**
	 * Hook expose by the Webpack compiler
	 *
	 * @param {Object} compilation The Webpack compilation variable
	 */
	hookCallback (compilation) {
		// Get public and output path
		const publicPath = this.getPublicPath(compilation)
		const outputPath = this.getOutputPath(compilation)

		const entryNames = this.getEntryNames(compilation)

		entryNames.forEach(entryName => {
			const files = this.getFiles({ entryName: entryName, compilation: compilation })

			// Check if entrypoint contains files and if chunks files generation is enabled
			if (files.length && this.options.generateChunksFiles) {
				const chunksSorted = this.sortsChunksByType({
					files: files,
					publicPath: publicPath
				})

				let tagsHTML = null

				// The user prefers to generate his own HTML tags, use his object
				if (
					this.options.customFormatTags &&
					typeof this.options.customFormatTags === 'function'
				) {
					// Change context of the function, to allow access to this class
					tagsHTML = this.options.customFormatTags.call(this, chunksSorted, files)

					// Check if datas are correctly formatted
					if (this.isCustomFormatTagsDatasInvalid(tagsHTML)) {
						utils.setError(
							'ChunksWebpackPlugin::customFormatTags return invalid object'
						)
					}
				} else {
					// Default behavior, generate HTML tags with templateStyle and templateScript
					tagsHTML = this.generateTags(chunksSorted)
				}

				this.createHtmlChunksFiles({
					entryName: entryName,
					tagsHTML: tagsHTML,
					outputPath: outputPath
				})

				// Check if manifest option is enabled
				if (this.options.generateChunksManifest) {
					this.updateManifest({
						entryName: entryName,
						chunks: chunksSorted
					})
				}
			}
		})

		// Check if manifest option is enabled
		if (this.options.generateChunksManifest) {
			this.createChunksManifestFile(compilation)
		}
	}

	/**
	 * Get the public path from Webpack configuation
	 * and add slash at the end if necessary
	 *
	 * @return {String} The public path
	 */
	getPublicPath (compilation) {
		let publicPath = compilation.options.output.publicPath || ''

		if (publicPath && publicPath.substr(-1) !== '/') {
			publicPath = `${publicPath}/`
		}

		return publicPath
	}

	/**
	 * Get the output path from Webpack configuation
	 * or from constructor options
	 *
	 * @param {Object} compilation Webpack compilation from compiler
	 *
	 * @return {String} The output path
	 */
	getOutputPath (compilation) {
		const optionsOutputPath = this.options.outputPath
		let outputPath

		if (optionsOutputPath === 'default') {
			// Use default Webpack outputPath
			outputPath = compilation.options.output.path || ''
		} else if (optionsOutputPath !== '' && utils.isAbsolutePath(optionsOutputPath)) {
			// Use custom outputPath (must be absolute)
			outputPath = optionsOutputPath
		} else {
			utils.setError('ChunksWebpackPlugin::outputPath option is invalid')
		}

		return outputPath
	}

	/**
	 * Get entrypoint names from the compilation
	 *
	 * @param {Object} compilation Webpack compilation from compiler
	 *
	 * @return {Array} List of entrypoint names
	 */
	getEntryNames (compilation) {
		return Array.from(compilation.entrypoints.keys())
	}

	/**
	 * Get files list by entrypoint name
	 *
	 * @param {Object} compilation Webpack compilation from compiler
	 * @param {String} entryName Entrypoint name
	 *
	 * @return {Array} List of entrypoint names
	 */
	getFiles ({ compilation, entryName }) {
		return compilation.entrypoints.get(entryName).getFiles()
	}

	/**
	 * Sorts all chunks by type (styles or scripts)
	 *
	 * @param {Array} files List of files by entrypoint name
	 * @param {String} publicPath Webpack public path
	 *
	 * @returns {Object} files All chunks sorted by type (extension)
	 */
	sortsChunksByType ({ files, publicPath }) {
		const sortedFiles = {
			styles: [],
			scripts: []
		}
		const extensionKeys = {
			css: 'styles',
			js: 'scripts'
		}

		files.forEach(file => {
			const extension = utils.getFileExtension(file)
			// ignore the other files, eg: sourceMap(*.map)
			if (!extensionKeys[extension]) {
				return
			}
			sortedFiles[extensionKeys[extension]].push(`${publicPath}${file}`)
		})

		return sortedFiles
	}

	/**
	 * Check if datas from customFormatTags is invalid
	 *
	 * @param {Object} tagsHTML Formatted HTML tags by styles and scripts keys
	 */
	isCustomFormatTagsDatasInvalid (tagsHTML) {
		return (
			tagsHTML === null ||
			typeof tagsHTML.styles === 'undefined' ||
			typeof tagsHTML.scripts === 'undefined'
		)
	}

	/**
	 * Generate HTML styles and scripts tags for each entrypoints
	 *
	 * @param {Object} chunksSorted The list of chunks of chunkGroups sorted by type
	 *
	 * @returns {Object} html HTML tags with all assets chunks
	 */
	generateTags (chunksSorted) {
		const html = {
			styles: '',
			scripts: ''
		}

		chunksSorted.styles.forEach(chunkCSS => {
			html.styles += this.options.templateStyle.replace('{{chunk}}', chunkCSS)
		})

		chunksSorted.scripts.forEach(chunkJS => {
			html.scripts += this.options.templateScript.replace('{{chunk}}', chunkJS)
		})

		return html
	}

	/**
	 * Create file with HTML tags for each entrypoints
	 *
	 * @param {String} entryName Entrypoint name
	 * @param {Object} tagsHTML Generated HTML of script and styles tags
	 * @param {String} outputPath Output path of generated files
	 */
	createHtmlChunksFiles ({ entryName, tagsHTML, outputPath }) {
		if (tagsHTML.scripts.length) {
			utils.writeFile({
				outputPath: `${outputPath}/${entryName}-scripts${this.options.fileExtension}`,
				output: tagsHTML.scripts
			})
		}
		if (tagsHTML.styles.length) {
			utils.writeFile({
				outputPath: `${outputPath}/${entryName}-styles${this.options.fileExtension}`,
				output: tagsHTML.styles
			})
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
		this.manifest[entryName] = {}
		this.manifest[entryName].styles = chunks.styles
		this.manifest[entryName].scripts = chunks.scripts
	}

	/**
	 * Create the chunks manifest file
	 * Contains all scripts and styles chunks grouped by entrypoint
	 *
	 * @param {Object} compilation Webpack compilation from compiler
	 */
	createChunksManifestFile (compilation) {
		// Stringify the content of the manifest
		const output = JSON.stringify(this.manifest, null, 2)

		// Expose the manifest file into the assets compilation
		// The file is automatically created by the compiler
		compilation.assets['chunks-manifest.json'] = {
			source: () => output,
			size: () => output.length
		}
	}
}
