'use strict'

import ChunksWebpackPlugin from '../index'
import utils from '../utils'

let chunksWebpackPlugin
let chunksSorted
let compilationWebpack
let compilerWebpack

const options = {
	outputPath: '/dist/templates',
	fileExtension: '.html',
	generateChunksManifest: true,
	generateChunksFiles: true,
	customFormatTags: (chunksSorted, chunkGroup) => {
		// Generate all HTML style tags with CDN prefix
		const styles = chunksSorted['styles'].map(chunkCss =>
			`<link rel="stylesheet" href="https://cdn.domain.com${chunkCss}" />`
		).join('')

		// Generate all HTML style tags with CDN prefix and defer attribute
		const scripts = chunksSorted['scripts'].map(chunkJs =>
			`<script defer src="https://cdn.domain.com${chunkJs}"></script>`
		).join('')

		return { styles, scripts }
	}
}

const getInstance = () => new ChunksWebpackPlugin(options)

const getChunksSorted = () => {
	return chunksWebpackPlugin.sortsChunksByType({
		chunks: compilationWebpack.chunkGroups[0].chunks,
		publicPath: chunksWebpackPlugin.getPublicPath(compilationWebpack)
	})
}

function updateManifest () {
	chunksWebpackPlugin.updateManifest({
		entryName: compilationWebpack.chunkGroups[0].options.name,
		chunks: chunksSorted
	})
}

beforeEach(() => {
	compilerWebpack = {
		hooks: {
			emit: {
				tap: () => {}
			}
		}
	}

	compilationWebpack = {
		assets: {},
		chunkGroups: [{
			chunks: [{
				files: [
					'css/vendors~app-a~app-b.css',
					'js/vendors~app-a~app-b.js'
				]
			}],
			options: {
				name: 'app-a'
			}
		}],
		options: {
			output: {
				path: '/dist/',
				publicPath: '/dist'
			}
		}
	}

	chunksWebpackPlugin = getInstance()
	chunksSorted = getChunksSorted()
})

describe('ChunksWebpackPlugin', () => {
	it('should init the constructor function', () => {
		expect(chunksWebpackPlugin.options).toMatchObject({
			outputPath: '/dist/templates',
			fileExtension: '.html',
			templateStyle: '<link rel="stylesheet" href="{{chunk}}" />',
			templateScript: '<script src="{{chunk}}"></script>',
			generateChunksManifest: true,
			generateChunksFiles: true,
			customFormatTags: expect.any(Function)
		})
	})

	it('should init the constructor function without options', () => {
		const instance = new ChunksWebpackPlugin()
		expect(instance.options).toMatchObject({
			outputPath: 'default',
			fileExtension: '.html',
			templateStyle: '<link rel="stylesheet" href="{{chunk}}" />',
			templateScript: '<script src="{{chunk}}"></script>',
			generateChunksManifest: false,
			generateChunksFiles: true,
			customFormatTags: false
		})
	})

	it('should init the apply function', () => {
		compilerWebpack.hooks.emit.tap = jest.fn()

		chunksWebpackPlugin.apply(compilerWebpack)
		compilerWebpack.hooks.emit.tap()

		expect(compilerWebpack.hooks.emit.tap).toHaveBeenCalled()
	})

	it('should init the hookEmit function', () => {
		chunksWebpackPlugin.createHtmlChunksFiles = jest.fn()

		chunksWebpackPlugin.hookEmit(compilationWebpack)

		expect(chunksWebpackPlugin.createHtmlChunksFiles).toHaveBeenCalled()
	})

	it('should init the hookEmit function with wrong returns of customFormatTags', () => {
		chunksWebpackPlugin.createHtmlChunksFiles = jest.fn()
		utils.setError = jest.fn()

		chunksWebpackPlugin.options.customFormatTags = (chunksSorted, chunkGroup) => ''
		chunksWebpackPlugin.hookEmit(compilationWebpack)

		expect(utils.setError).toHaveBeenCalled()
		expect(chunksWebpackPlugin.createHtmlChunksFiles).toHaveBeenCalled()
	})

	it('should init the hookEmit function with wrong declaration of customFormatTags', () => {
		chunksWebpackPlugin.createHtmlChunksFiles = jest.fn()
		chunksWebpackPlugin.generateTags = jest.fn()

		chunksWebpackPlugin.options.customFormatTags = ''
		chunksWebpackPlugin.hookEmit(compilationWebpack)

		expect(chunksWebpackPlugin.generateTags).toHaveBeenCalled()
	})

	it('should init the updateManifest function', () => {
		updateManifest()

		expect(chunksWebpackPlugin.manifest).toMatchObject({
			'app-a': {
				styles: ['/dist/css/vendors~app-a~app-b.css'],
				scripts: ['/dist/js/vendors~app-a~app-b.js']
			}
		})
	})

	it('should init the getPublicPath function', () => {
		const publicPath = chunksWebpackPlugin.getPublicPath(compilationWebpack)

		expect(publicPath).toBe('/dist/')
	})

	it('should init the getPublicPath function with empty value', () => {
		compilationWebpack.options.output.publicPath = false
		const publicPath = chunksWebpackPlugin.getPublicPath(compilationWebpack)

		expect(publicPath).toBe('')
	})

	it('should init the getOutputPath function', () => {
		const outputPath = chunksWebpackPlugin.getOutputPath(compilationWebpack)

		expect(outputPath).toBe('/dist/templates')
	})

	it('should init the getOutputPath function with default outputPath', () => {
		chunksWebpackPlugin.options.outputPath = 'default'
		const outputPath = chunksWebpackPlugin.getOutputPath(compilationWebpack)

		expect(outputPath).toBe('/dist/')
	})

	it('should init the getOutputPath function with default outputPath and without value', () => {
		compilationWebpack.options.output.path = false
		chunksWebpackPlugin.options.outputPath = 'default'
		const outputPath = chunksWebpackPlugin.getOutputPath(compilationWebpack)

		expect(outputPath).toBe('')
	})

	it('should init the getOutputPath function with wrong outputPath', () => {
		utils.setError = jest.fn()

		chunksWebpackPlugin.options.outputPath = ''
		chunksWebpackPlugin.getOutputPath(compilationWebpack)

		expect(utils.setError).toHaveBeenCalled()
	})

	it('should init the sortsChunksByType function', () => {
		expect(chunksSorted).toMatchObject({
			styles: ['/dist/css/vendors~app-a~app-b.css'],
			scripts: ['/dist/js/vendors~app-a~app-b.js']
		})
	})

	it('should init the generateTags function', () => {
		const tags = chunksWebpackPlugin.generateTags(chunksSorted)

		expect(tags).toMatchObject({
			styles: '<link rel="stylesheet" href="/dist/css/vendors~app-a~app-b.css" />',
			scripts: '<script src="/dist/js/vendors~app-a~app-b.js"></script>'
		})
	})

	it('should init the createHtmlChunksFiles function', () => {
		utils.writeFile = jest.fn()

		chunksWebpackPlugin.createHtmlChunksFiles({
			entry: 'app-a',
			tagsHTML: {
				styles: '<link rel="stylesheet" href="/dist/css/vendors~app-a~app-b.css" />',
				scripts: '<script src="/dist/js/vendors~app-a~app-b.js"></script>'
			},
			outputPath: '/dist/'
		})

		expect(utils.writeFile).toHaveBeenCalled()
	})

	it('should init the createChunksManifestFile function', () => {
		updateManifest()

		chunksWebpackPlugin.createChunksManifestFile({
			compilation: compilationWebpack,
			outputPath: chunksWebpackPlugin.getOutputPath(compilationWebpack)
		})

		expect(Object.keys(compilationWebpack.assets)).toEqual(['chunks-manifest.json'])
		expect(Object.keys(compilationWebpack.assets['chunks-manifest.json'])).toEqual(['source', 'size'])

		const source = compilationWebpack.assets['chunks-manifest.json'].source()
		expect(source).toEqual(JSON.stringify({
			'app-a': {
				styles: ['/dist/css/vendors~app-a~app-b.css'],
				scripts: ['/dist/js/vendors~app-a~app-b.js']
			}
		}, null, 2))

		const size = compilationWebpack.assets['chunks-manifest.json'].size()
		expect(size).toEqual(148)
	})
})
