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
		const styles = chunksSorted.styles
			.map(chunkCss => `<link rel="stylesheet" href="https://cdn.domain.com${chunkCss}" />`)
			.join('')

		// Generate all HTML style tags with CDN prefix and defer attribute
		const scripts = chunksSorted.scripts
			.map(chunkJs => `<script defer src="https://cdn.domain.com${chunkJs}"></script>`)
			.join('')

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
		chunkGroups: [
			{
				chunks: [
					{
						files: ['css/vendors~app-a~app-b.css', 'js/vendors~app-a~app-b.js']
					}
				],
				options: {
					name: 'app-a'
				}
			}
		],
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
	it('Initialize the constructor', () => {
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

	it('Initialize the constructor without options', () => {
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

	it('Initialize the apply function', () => {
		compilerWebpack.hooks.emit.tap = jest.fn()

		chunksWebpackPlugin.apply(compilerWebpack)
		compilerWebpack.hooks.emit.tap()

		expect(compilerWebpack.hooks.emit.tap).toHaveBeenCalled()
	})

	it('Initialize the hookEmit function', () => {
		chunksWebpackPlugin.createHtmlChunksFiles = jest.fn()

		chunksWebpackPlugin.hookEmit(compilationWebpack)

		expect(chunksWebpackPlugin.createHtmlChunksFiles).toHaveBeenCalled()
	})

	it('Initialize the hookEmit function without chunks', () => {
		chunksWebpackPlugin.sortsChunksByType = jest.fn()

		compilationWebpack.chunkGroups[0].chunks = []
		chunksWebpackPlugin.hookEmit(compilationWebpack)

		expect(chunksWebpackPlugin.sortsChunksByType).not.toHaveBeenCalled()
	})

	it('Initialize the hookEmit function without generating chunk files', () => {
		chunksWebpackPlugin.createHtmlChunksFiles = jest.fn()

		chunksWebpackPlugin.options.generateChunksFiles = false
		chunksWebpackPlugin.hookEmit(compilationWebpack)

		expect(chunksWebpackPlugin.createHtmlChunksFiles).not.toHaveBeenCalled()
	})

	it('Initialize the hookEmit function without generating chunk manifest', () => {
		chunksWebpackPlugin.createHtmlChunksFiles = jest.fn()
		chunksWebpackPlugin.updateManifest = jest.fn()

		chunksWebpackPlugin.options.generateChunksManifest = false
		chunksWebpackPlugin.hookEmit(compilationWebpack)

		expect(chunksWebpackPlugin.updateManifest).not.toHaveBeenCalled()
	})

	it('Initialize the hookEmit function with wrong returns of customFormatTags', () => {
		chunksWebpackPlugin.createHtmlChunksFiles = jest.fn()
		utils.setError = jest.fn()

		chunksWebpackPlugin.options.customFormatTags = (chunksSorted, chunkGroup) => ''
		chunksWebpackPlugin.hookEmit(compilationWebpack)

		expect(utils.setError).toHaveBeenCalled()
		expect(chunksWebpackPlugin.createHtmlChunksFiles).toHaveBeenCalled()
	})

	it('Initialize the hookEmit function with wrong declaration of customFormatTags', () => {
		chunksWebpackPlugin.createHtmlChunksFiles = jest.fn()
		chunksWebpackPlugin.generateTags = jest.fn()

		chunksWebpackPlugin.options.customFormatTags = ''
		chunksWebpackPlugin.hookEmit(compilationWebpack)

		expect(chunksWebpackPlugin.generateTags).toHaveBeenCalled()
	})

	it('Initialize the updateManifest function', () => {
		updateManifest()

		expect(chunksWebpackPlugin.manifest).toMatchObject({
			'app-a': {
				styles: ['/dist/css/vendors~app-a~app-b.css'],
				scripts: ['/dist/js/vendors~app-a~app-b.js']
			}
		})
	})

	it('Initialize the getPublicPath function', () => {
		const publicPath = chunksWebpackPlugin.getPublicPath(compilationWebpack)

		expect(publicPath).toBe('/dist/')
	})

	it('Initialize the getPublicPath function with empty value', () => {
		compilationWebpack.options.output.publicPath = false
		const publicPath = chunksWebpackPlugin.getPublicPath(compilationWebpack)

		expect(publicPath).toBe('')
	})

	it('Initialize the getOutputPath function', () => {
		const outputPath = chunksWebpackPlugin.getOutputPath(compilationWebpack)

		expect(outputPath).toBe('/dist/templates')
	})

	it('Initialize the getOutputPath function with default outputPath', () => {
		chunksWebpackPlugin.options.outputPath = 'default'
		const outputPath = chunksWebpackPlugin.getOutputPath(compilationWebpack)

		expect(outputPath).toBe('/dist/')
	})

	it('Initialize the getOutputPath function with default outputPath and without value', () => {
		compilationWebpack.options.output.path = false
		chunksWebpackPlugin.options.outputPath = 'default'
		const outputPath = chunksWebpackPlugin.getOutputPath(compilationWebpack)

		expect(outputPath).toBe('')
	})

	it('Initialize the getOutputPath function with wrong outputPath', () => {
		utils.setError = jest.fn()

		chunksWebpackPlugin.options.outputPath = ''
		chunksWebpackPlugin.getOutputPath(compilationWebpack)

		expect(utils.setError).toHaveBeenCalled()
	})

	it('Initialize the sortsChunksByType function', () => {
		expect(chunksSorted).toMatchObject({
			styles: ['/dist/css/vendors~app-a~app-b.css'],
			scripts: ['/dist/js/vendors~app-a~app-b.js']
		})
	})

	it('Initialize the sortsChunksByType function with scripts only', () => {
		const chunksSorted = chunksWebpackPlugin.sortsChunksByType({
			chunks: [
				{
					files: ['css/vendors~app-a~app-b.css']
				}
			],
			publicPath: chunksWebpackPlugin.getPublicPath(compilationWebpack)
		})

		expect(chunksSorted.scripts.length).toEqual(0)
	})

	it('Initialize the generateTags function', () => {
		const tags = chunksWebpackPlugin.generateTags(chunksSorted)

		expect(tags).toMatchObject({
			styles: '<link rel="stylesheet" href="/dist/css/vendors~app-a~app-b.css" />',
			scripts: '<script src="/dist/js/vendors~app-a~app-b.js"></script>'
		})
	})

	it('Initialize the createHtmlChunksFiles function', () => {
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

	it('Initialize the createHtmlChunksFiles function without styles and scripts', () => {
		utils.writeFile = jest.fn()

		chunksWebpackPlugin.createHtmlChunksFiles({
			entry: 'app-a',
			tagsHTML: {
				styles: '',
				scripts: ''
			},
			outputPath: '/dist/'
		})

		expect(utils.writeFile).not.toHaveBeenCalled()
	})

	it('Initialize the createChunksManifestFile function', () => {
		updateManifest()

		chunksWebpackPlugin.createChunksManifestFile({
			compilation: compilationWebpack,
			outputPath: chunksWebpackPlugin.getOutputPath(compilationWebpack)
		})

		expect(Object.keys(compilationWebpack.assets)).toEqual(['chunks-manifest.json'])
		expect(Object.keys(compilationWebpack.assets['chunks-manifest.json'])).toEqual([
			'source',
			'size'
		])

		const source = compilationWebpack.assets['chunks-manifest.json'].source()
		expect(source).toEqual(
			JSON.stringify(
				{
					'app-a': {
						styles: ['/dist/css/vendors~app-a~app-b.css'],
						scripts: ['/dist/js/vendors~app-a~app-b.js']
					}
				},
				null,
				2
			)
		)

		const size = compilationWebpack.assets['chunks-manifest.json'].size()
		expect(size).toEqual(148)
	})

	it('Initialize sortsChunksByType function ignore source map file', () => {
		chunksWebpackPlugin.updateManifest = jest.fn()
		chunksWebpackPlugin.createHtmlChunksFiles = jest.fn()
		const chunksSorted = chunksWebpackPlugin.sortsChunksByType({
			chunks: [
				{
					files: [
						'css/vendors~app-a~app-b.css',
						'js/vendors~app-a~app-b.js',
						'js/vendors~app-a~app-b.js.map'
					]
				}
			],
			publicPath: chunksWebpackPlugin.getPublicPath(compilationWebpack)
		})
		expect(chunksSorted).toEqual({
			styles: ['/dist/css/vendors~app-a~app-b.css'],
			scripts: ['/dist/js/vendors~app-a~app-b.js']
		})
	})

	it('Initialize the hookEmit function ignore dynamic import chunk', () => {
		chunksWebpackPlugin.createHtmlChunksFiles = jest.fn()
		chunksWebpackPlugin.options.customFormatTags = ''
		chunksWebpackPlugin.options.outputPath = 'default'
		compilationWebpack.chunkGroups.push({
			chunks: [
				{
					files: ['js/lib-dynamic.js', 'js/lib-dynamic.js.map']
				}
			],
			options: { name: null }
		})
		chunksWebpackPlugin.hookEmit(compilationWebpack)
		expect(chunksWebpackPlugin.createHtmlChunksFiles).not.toHaveBeenCalledWith({
			entry: null,
			tagsHTML: {
				styles: '',
				scripts: '<script src="/dist/js/4.js"></script>'
			},
			outputPath: '/dist/'
		})
	})

	it('Initialize the hookEmit function ignore dynamic import chunk (webpack v4.0.0 notation)', () => {
		chunksWebpackPlugin.createHtmlChunksFiles = jest.fn()
		chunksWebpackPlugin.options.customFormatTags = ''
		chunksWebpackPlugin.options.outputPath = 'default'
		compilationWebpack.chunkGroups.push({
			chunks: [
				{
					files: ['js/lib-dynamic.js', 'js/lib-dynamic.js.map']
				}
			],
			name: null
		})
		chunksWebpackPlugin.hookEmit(compilationWebpack)
		expect(chunksWebpackPlugin.createHtmlChunksFiles).not.toHaveBeenCalledWith({
			entry: null,
			tagsHTML: {
				styles: '',
				scripts: '<script src="/dist/js/4.js"></script>'
			},
			outputPath: '/dist/'
		})
	})
})
