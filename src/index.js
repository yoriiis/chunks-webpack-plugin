/**
 * @license MIT
 * @name ChunksWebpackPlugin
 * @version 3.3.0
 * @author: Yoriiis aka Joris DANIEL <joris.daniel@gmail.com>
 * @description:
 * {@link https://github.com/yoriiis/chunks-webpack-plugins}
 * @copyright 2019 Joris DANIEL
 **/

const utils = require('./utils')

module.exports = class ChunksWebpackPlugin {
	/**
	 * Instanciate the constructor
	 * @param {options}
	 */
	constructor (options = {}) {
		// Merge default options with user options
		this.options = Object.assign({
			outputPath: 'default',
			fileExtension: '.html',
			templateStyle: `<link rel="stylesheet" href="{{chunk}}" />`,
			templateScript: `<script src="{{chunk}}"></script>`,
			customFormatTags: false,
			generateChunksManifest: false,
			generateChunksFiles: true
		}, options)
		this.manifest = {}
	}

	/**
	 * Apply function is automatically called by the Webpack main compiler
	 *
	 * @param {Object} compiler The Webpack compiler variable
	 */
	apply (compiler) {
		compiler.hooks.done.tap('compilerDone', this.compilerDone.bind(this))
	}

	/**
	 * Hook expose by the Webpack compiler
	 *
	 * @param {Object} stats The Webpack compilation variable
	 */
	compilerDone (stats) {
		// Get public and output path
		const publicPath = this.getPublicPath(stats)
		const outputPath = this.getOutputPath(stats)

		// Check if destination directory exist, else create the directory
		if (stats.compilation.chunkGroups.length) {
			utils.checkDestinationFolder(outputPath)
		}

		stats.compilation.chunkGroups.forEach(chunkGroup => {
			// Check if chunkGroup contains chunks
			if (chunkGroup.chunks.length) {
				const entryName = chunkGroup.options.name
				let chunksSorted = this.sortsChunksByType({
					chunks: chunkGroup.chunks,
					publicPath: publicPath
				})

				// Check if chunks files generation is enabled
				if (this.options.generateChunksFiles) {
					let tagsHTML = null

					// The user prefers to generate his own HTML tags, use his object
					if (this.options.customFormatTags && typeof this.options.customFormatTags === 'function') {
						// Change context of the function, to allow access to this class
						tagsHTML = this.options.customFormatTags.call(this, chunksSorted, chunkGroup)

						// Check if datas are correctly formatted
						if (tagsHTML === null || typeof tagsHTML.styles === 'undefined' || typeof tagsHTML.scripts === 'undefined') {
							utils.setError('ChunksWebpackPlugin::customFormatTags return invalid object')
						}
					} else {
						// Default behavior, generate HTML tags with templateStyle and templateScript
						tagsHTML = this.generateTags(chunksSorted)
					}

					this.createChunksFiles({
						entry: entryName,
						tagsHTML: tagsHTML,
						outputPath: outputPath
					})
				}

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
			this.createChunksManifestFile(outputPath)
		}
	}

	/**
	 * Update the class property manifest
	 * which contains all chunks informations by entrypoint
	 *
	 * @param {String} entryName Entrypoint name
	 * @param {Object} chunks List of styles and scripts chunks by entrypoint
	 */
	updateManifest ({entryName, chunks}) {
		this.manifest[entryName] = {}
		this.manifest[entryName]['styles'] = chunks['styles']
		this.manifest[entryName]['scripts'] = chunks['scripts']
	}

	/**
	 * Get the public path from Webpack configuation
	 * and add slash at the end if necessary
	 *
	 * @param {Object} stats
	 *
	 * @return {String} The public path
	 */
	getPublicPath (stats) {
		let publicPath = stats.compilation.options.output.publicPath || ''

		if (publicPath) {
			if (publicPath.substr(-1) !== '/') {
				publicPath = `${publicPath}/`
			}
		}

		return publicPath
	}

	/**
	 * Get the output path from Webpack configuation
	 * or from constructor options
	 *
	 * @param {Object} stats
	 *
	 * @return {String} The output path
	 */
	getOutputPath (stats) {
		let outputPath

		if (this.options.outputPath === 'default') {
			// Use default Webpack outputPath
			outputPath = stats.compilation.options.output.path || ''
		} else if (utils.isOutputPathValid(this.options.outputPath)) {
			// Use custom outputPath (must be absolute)
			outputPath = this.options.outputPath
		} else {
			utils.setError('ChunksWebpackPlugin::outputPath option is invalid')
		}

		return outputPath
	}

	/**
	 * Sorts all chunks by type (styles or scripts)
	 *
	 * @param {Array} chunks The list of chunks of chunkGroups
	 * @param {Array} chunks The list of chunks of chunkGroups
	 *
	 * @returns {Object} files All chunks sorted by type (extension)
	 */
	sortsChunksByType ({chunks, publicPath}) {
		let files = {
			'styles': [],
			'scripts': []
		}

		chunks.forEach(chunk => {
			chunk.files.forEach(file => {
				if (utils.getFileExtension(file) === 'css') {
					files['styles'].push(`${publicPath}${file}`)
				} else if (utils.getFileExtension(file) === 'js') {
					files['scripts'].push(`${publicPath}${file}`)
				}
			})
		})

		return files
	}

	/**
	 * Generate HTML styles and scripts tags for each entrypoints
	 *
	 * @param {Object} chunksSorted The list of chunks of chunkGroups sorted by type
	 *
	 * @returns {Object} html HTML tags with all assets chunks
	 */
	generateTags (chunksSorted) {
		let html = {
			'styles': '',
			'scripts': ''
		}

		chunksSorted['styles'].forEach(chunkCSS => {
			html['styles'] += this.options.templateStyle.replace('{{chunk}}', chunkCSS)
		})

		chunksSorted['scripts'].forEach(chunkJS => {
			html['scripts'] += this.options.templateScript.replace('{{chunk}}', chunkJS)
		})

		return html
	}

	/**
	 * Create file with HTML tags for each entrypoints
	 *
	 * @param {String} entry Entrypoint name
	 * @param {Object} tagsHTML Generated HTML of script and styles tags
	 * @param {String} outputPath Output path of generated files
	 */
	createChunksFiles ({
		entry,
		tagsHTML,
		outputPath
	}) {
		if (tagsHTML.scripts.length) {
			utils.writeFile({
				path: `${outputPath}/${entry}-scripts${this.options.fileExtension}`,
				content: tagsHTML.scripts
			})
		}
		if (tagsHTML.styles.length) {
			utils.writeFile({
				path: `${outputPath}/${entry}-styles${this.options.fileExtension}`,
				content: tagsHTML.styles
			})
		}
	}

	/**
	 * Create the chunks manifest file
	 * Contains all scripts and styles chunks by entrypoint
	 *
	 * @param {String} outputPath Output path of generated files
	 */
	createChunksManifestFile (outputPath) {
		utils.writeFile({
			path: `${outputPath}/chunks-manifest.json`,
			content: JSON.stringify(this.manifest, null, 2)
		})
	}
}
