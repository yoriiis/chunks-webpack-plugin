'use strict'

import ChunksWebpackPlugin from '../index'

const getInstance = () => new ChunksWebpackPlugin({
	outputPath: '/dist/templates',
	fileExtension: '.html',
	generateChunksManifest: true,
	generateChunksFiles: true
})

let chunksWebpackPlugin
let compilationWebpack

beforeEach(() => {
	compilationWebpack = {
		assets: {},
		chunkGroups: [
			{
				chunks: [
					{
						files: [
							'css/vendors~app-a~app-b.css',
							'js/vendors~app-a~app-b.js'
						]
					}
				],
				options: {
					name: 'app-a'
				}
			}
		],
		options: {
			output: {
				path:
					'/Users/jdaniel/Development/sandbox/chunks-webpack-plugin/demo/dist',
				publicPath: '/dist/'
			}
		}
	}
	chunksWebpackPlugin = getInstance()
})

describe('ChunksWebpackPlugin', () => {
	it('should init the hookEmit function', () => {
		chunksWebpackPlugin.createHtmlChunksFiles = jest.fn()
		chunksWebpackPlugin.hookEmit(compilationWebpack)
		expect(chunksWebpackPlugin.createHtmlChunksFiles).toHaveBeenCalled()
	})

	it('should init the updateManifest function', () => {
		compilationWebpack.chunkGroups.forEach(chunkGroup => {
			let chunksSorted = chunksWebpackPlugin.sortsChunksByType({
				chunks: chunkGroup.chunks,
				publicPath: compilationWebpack.options.output.publicPath
			})

			chunksWebpackPlugin.updateManifest({
				entryName: chunkGroup.options.name,
				chunks: chunksSorted
			})

			expect(chunksWebpackPlugin.manifest).toMatchObject({
				'app-a': {
					styles: [
						'/dist/css/vendors~app-a~app-b.css'
					],
					scripts: [
						'/dist/js/vendors~app-a~app-b.js'
					]
				}
			})
		})
	})

	it('should init the getPublicPath function', () => {
		const publicPath = chunksWebpackPlugin.getPublicPath(compilationWebpack)
		expect(publicPath).toBe('/dist/')
	})

	it('should init the getOutputPath function', () => {
		const outputPath = chunksWebpackPlugin.getOutputPath(compilationWebpack)
		expect(outputPath).toBe('/dist/templates')
	})

	it('should init the sortsChunksByType function', () => {
		compilationWebpack.chunkGroups.forEach(chunkGroup => {
			let chunksSorted = chunksWebpackPlugin.sortsChunksByType({
				chunks: chunkGroup.chunks,
				publicPath: compilationWebpack.options.output.publicPath
			})

			expect(chunksSorted).toMatchObject({
				styles: ['/dist/css/vendors~app-a~app-b.css'],
				scripts: ['/dist/js/vendors~app-a~app-b.js']
			})
		})
	})

	it('should init the generateTags function', () => {
		compilationWebpack.chunkGroups.forEach(chunkGroup => {
			let chunksSorted = chunksWebpackPlugin.sortsChunksByType({
				chunks: chunkGroup.chunks,
				publicPath: compilationWebpack.options.output.publicPath
			})

			const tags = chunksWebpackPlugin.generateTags(chunksSorted)

			expect(tags).toMatchObject({
				styles: '<link rel="stylesheet" href="/dist/css/vendors~app-a~app-b.css" />',
				scripts: '<script src="/dist/js/vendors~app-a~app-b.js"></script>'
			})
		})
	})

	it('should init the createChunksManifestFile function', () => {
		const outputPath = chunksWebpackPlugin.getOutputPath(compilationWebpack)

		compilationWebpack.chunkGroups.forEach(chunkGroup => {
			let chunksSorted = chunksWebpackPlugin.sortsChunksByType({
				chunks: chunkGroup.chunks,
				publicPath: compilationWebpack.options.output.publicPath
			})

			chunksWebpackPlugin.updateManifest({
				entryName: chunkGroup.options.name,
				chunks: chunksSorted
			})
		})

		chunksWebpackPlugin.createChunksManifestFile({
			compilation: compilationWebpack,
			outputPath: outputPath
		})

		expect(Object.keys(compilationWebpack.assets)).toEqual(['chunks-manifest.json'])
		expect(Object.keys(compilationWebpack.assets['chunks-manifest.json'])).toEqual(['source', 'size'])

		const source = compilationWebpack.assets['chunks-manifest.json'].source()
		expect(source).toEqual(JSON.stringify({
			'app-a': {
				styles: [
					'/dist/css/vendors~app-a~app-b.css'
				],
				scripts: [
					'/dist/js/vendors~app-a~app-b.js'
				]
			}
		}, null, 2))

		const size = compilationWebpack.assets['chunks-manifest.json'].size()
		expect(size).toEqual(148)
	})
})
