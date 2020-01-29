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
		compiler.hooks.emit.tap('ChunksWebpackPlugin', this.hookEmit.bind(this))
	}

	/**
	 * Hook expose by the Webpack compiler
	 *
	 * @param {Object} compilation The Webpack compilation variable
	 */
	hookEmit (compilation) {
		this.compilation = compilation

		// Get public and output path
		this.publicPath = this.getPublicPath()
		this.outputPath = this.getOutputPath()
		const entryNames = this.getEntryNames()

		entryNames.forEach(entryName => {
			const files = this.getFiles(entryName)

			// Check if chunkGroup contains chunks
			if (files.length) {
				const chunksSorted = this.sortsChunksByType(files)

				// Check if chunks files generation is enabled
				if (this.options.generateChunksFiles) {
					let tagsHTML = null

					// The user prefers to generate his own HTML tags, use his object
					if (
						this.options.customFormatTags &&
						typeof this.options.customFormatTags === 'function'
					) {
						// Change context of the function, to allow access to this class
						tagsHTML = this.options.customFormatTags.call(this, chunksSorted, files)

						// Check if datas are correctly formatted
						if (
							tagsHTML === null ||
							typeof tagsHTML.styles === 'undefined' ||
							typeof tagsHTML.scripts === 'undefined'
						) {
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
						tagsHTML: tagsHTML
					})

					// Check if manifest option is enabled
					if (this.options.generateChunksManifest) {
						this.updateManifest({
							entryName: entryName,
							chunks: chunksSorted
						})
					}
				}
			}
		})

		// Check if manifest option is enabled
		if (this.options.generateChunksManifest) {
			this.createChunksManifestFile()
		}
	}

	/**
	 * Get entrypoint names from the compilation
	 *
	 * @return {Array} List of entrypoint names
	 */
	getEntryNames () {
		return Array.from(this.compilation.entrypoints.keys())
	}

	/**
	 * Get files list by entrypoint name
	 *
	 * @param {String} entryName Entrypoint name
	 * @return {Array} List of entrypoint names
	 */
	getFiles (entryName) {
		return this.compilation.entrypoints.get(entryName).getFiles()
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
	 * Get the public path from Webpack configuation
	 * and add slash at the end if necessary
	 *
	 * @return {String} The public path
	 */
	getPublicPath () {
		let publicPath = this.compilation.options.output.publicPath || ''

		if (publicPath && publicPath.substr(-1) !== '/') {
			publicPath = `${publicPath}/`
		}

		return publicPath
	}

	/**
	 * Get the output path from Webpack configuation
	 * or from constructor options
	 *
	 * @return {String} The output path
	 */
	getOutputPath () {
		const optionsOutputPath = this.options.outputPath
		let outputPath

		if (optionsOutputPath === 'default') {
			// Use default Webpack outputPath
			outputPath = this.compilation.options.output.path || ''
		} else if (optionsOutputPath !== '' && utils.isAbsolutePath(optionsOutputPath)) {
			// Use custom outputPath (must be absolute)
			outputPath = optionsOutputPath
		} else {
			utils.setError('ChunksWebpackPlugin::outputPath option is invalid')
		}

		return outputPath
	}

	/**
	 * Sorts all chunks by type (styles or scripts)
	 *
	 * @param {Array} files List of files by entrypoint name
	 *
	 * @returns {Object} files All chunks sorted by type (extension)
	 */
	sortsChunksByType (files) {
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
			sortedFiles[extensionKeys[extension]].push(`${this.publicPath}${file}`)
		})

		return sortedFiles
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
	 */
	createHtmlChunksFiles ({ entryName, tagsHTML }) {
		if (tagsHTML.scripts.length) {
			utils.writeFile({
				outputPath: `${this.outputPath}/${entryName}-scripts${this.options.fileExtension}`,
				output: tagsHTML.scripts
			})
		}
		if (tagsHTML.styles.length) {
			utils.writeFile({
				outputPath: `${this.outputPath}/${entryName}-styles${this.options.fileExtension}`,
				output: tagsHTML.styles
			})
		}
	}

	/**
	 * Create the chunks manifest file
	 * Contains all scripts and styles chunks grouped by entrypoint
	 */
	createChunksManifestFile () {
		// Stringify the content of the manifest
		const output = JSON.stringify(this.manifest, null, 2)

		// Expose the manifest file into the assets compilation
		// The file is automatically created by the compiler
		this.compilation.assets['chunks-manifest.json'] = {
			source: () => output,
			size: () => output.length
		}
	}
}
