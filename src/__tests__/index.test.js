'use strict';

import ChunksWebpackPlugin from '../index';
import utils from '../utils';

let chunksWebpackPlugin;
let chunksSorted;
let compilationWebpack;
let compilerWebpack;

const options = {
	outputPath: '/dist/templates',
	fileExtension: '.html',
	generateChunksManifest: true,
	generateChunksFiles: true,
	customFormatTags: (chunksSorted, files) => {
		// Generate all HTML style tags with CDN prefix
		const styles = chunksSorted.styles
			.map(chunkCss => `<link rel="stylesheet" href="https://cdn.domain.com${chunkCss}" />`)
			.join('');

		// Generate all HTML style tags with CDN prefix and defer attribute
		const scripts = chunksSorted.scripts
			.map(chunkJs => `<script defer src="https://cdn.domain.com${chunkJs}"></script>`)
			.join('');

		return { styles, scripts };
	}
};

const getInstance = () => new ChunksWebpackPlugin(options);

const getChunksSorted = () => {
	return chunksWebpackPlugin.sortsChunksByType({
		files: compilationWebpack.entrypoints.get('app-a').getFiles(),
		publicPath: chunksWebpackPlugin.getPublicPath(compilationWebpack)
	});
};

function updateManifest () {
	chunksWebpackPlugin.updateManifest({
		entryName: Array.from(compilationWebpack.entrypoints.keys())[0],
		chunks: chunksSorted
	});
}

const entrypointsMap = new Map();
entrypointsMap.set('app-a', {
	chunks: {
		files: [
			'css/vendors~app-a~app-b~app-c.css',
			'js/vendors~app-a~app-b~app-c.js',
			'css/vendors~app-a~app-b~app-c.css.map',
			'js/vendors~app-a~app-b~app-c.js.map',
			'css/app-a.css',
			'js/app-a.js',
			'css/app-a.css.map',
			'js/app-a.js.map'
		]
	},
	getFiles: () => entrypointsMap.get('app-a').chunks.files
});
entrypointsMap.set('app-b', {
	chunks: {
		files: [
			'css/vendors~app-a~app-b~app-c.css',
			'js/vendors~app-a~app-b~app-c.js',
			'css/vendors~app-a~app-b~app-c.css.map',
			'js/vendors~app-a~app-b~app-c.js.map',
			'css/app-b.css',
			'js/app-b.js',
			'css/app-b.css.map',
			'js/app-b.js.map'
		]
	},
	getFiles: () => entrypointsMap.get('app-b').chunks.files
});
entrypointsMap.set('app-c', {
	chunks: {
		files: [
			'css/vendors~app-a~app-b~app-c.css',
			'js/vendors~app-a~app-b~app-c.js',
			'css/vendors~app-a~app-b~app-c.css.map',
			'js/vendors~app-a~app-b~app-c.js.map',
			'css/app-c.css',
			'js/app-c.js',
			'css/app-c.css.map',
			'js/app-c.js.map'
		]
	},
	getFiles: () => entrypointsMap.get('app-c').chunks.files
});

beforeEach(() => {
	compilerWebpack = {
		hooks: {
			emit: {
				tap: () => {}
			}
		}
	};

	compilationWebpack = {
		assets: {},
		entrypoints: entrypointsMap,
		options: {
			output: {
				path: '/dist/',
				publicPath: '/dist'
			}
		}
	};

	chunksWebpackPlugin = getInstance();
	chunksSorted = getChunksSorted();
});

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
		});
	});

	it('Initialize the constructor without options', () => {
		const instance = new ChunksWebpackPlugin();
		expect(instance.options).toMatchObject({
			outputPath: 'default',
			fileExtension: '.html',
			templateStyle: '<link rel="stylesheet" href="{{chunk}}" />',
			templateScript: '<script src="{{chunk}}"></script>',
			generateChunksManifest: false,
			generateChunksFiles: true,
			customFormatTags: false
		});
	});

	it('Initialize the apply function', () => {
		compilerWebpack.hooks.emit.tap = jest.fn();

		chunksWebpackPlugin.apply(compilerWebpack);
		compilerWebpack.hooks.emit.tap();

		expect(compilerWebpack.hooks.emit.tap).toHaveBeenCalled();
	});

	it('Initialize the hookCallback function', () => {
		chunksWebpackPlugin.createHtmlChunksFiles = jest.fn();

		chunksWebpackPlugin.hookCallback(compilationWebpack);

		expect(chunksWebpackPlugin.createHtmlChunksFiles).toHaveBeenCalled();
	});

	it('Initialize the hookCallback function without generating chunk files', () => {
		chunksWebpackPlugin.createHtmlChunksFiles = jest.fn();

		chunksWebpackPlugin.options.generateChunksFiles = false;
		chunksWebpackPlugin.hookCallback(compilationWebpack);

		expect(chunksWebpackPlugin.createHtmlChunksFiles).not.toHaveBeenCalled();
	});

	it('Initialize the hookCallback function without generating chunk manifest', () => {
		chunksWebpackPlugin.createHtmlChunksFiles = jest.fn();
		chunksWebpackPlugin.updateManifest = jest.fn();

		chunksWebpackPlugin.options.generateChunksManifest = false;
		chunksWebpackPlugin.hookCallback(compilationWebpack);

		expect(chunksWebpackPlugin.updateManifest).not.toHaveBeenCalled();
	});

	it('Initialize the hookCallback function with wrong returns of customFormatTags', () => {
		chunksWebpackPlugin.createHtmlChunksFiles = jest.fn();
		utils.setError = jest.fn();

		chunksWebpackPlugin.options.customFormatTags = (chunksSorted, files) => '';
		chunksWebpackPlugin.hookCallback(compilationWebpack);

		expect(utils.setError).toHaveBeenCalled();
		expect(chunksWebpackPlugin.createHtmlChunksFiles).toHaveBeenCalled();
	});

	it('Initialize the hookCallback function with wrong declaration of customFormatTags', () => {
		chunksWebpackPlugin.createHtmlChunksFiles = jest.fn();
		chunksWebpackPlugin.generateTags = jest.fn();

		chunksWebpackPlugin.options.customFormatTags = '';
		chunksWebpackPlugin.hookCallback(compilationWebpack);

		expect(chunksWebpackPlugin.generateTags).toHaveBeenCalled();
	});

	it('Initialize the updateManifest function', () => {
		updateManifest();

		expect(chunksWebpackPlugin.manifest).toMatchObject({
			'app-a': {
				styles: ['/dist/css/vendors~app-a~app-b~app-c.css', '/dist/css/app-a.css'],
				scripts: ['/dist/js/vendors~app-a~app-b~app-c.js', '/dist/js/app-a.js']
			}
		});
	});

	it('Initialize the getPublicPath function', () => {
		const publicPath = chunksWebpackPlugin.getPublicPath(compilationWebpack);

		expect(publicPath).toBe('/dist/');
	});

	it('Initialize the getPublicPath function with empty value', () => {
		compilationWebpack.options.output.publicPath = false;
		const publicPath = chunksWebpackPlugin.getPublicPath(compilationWebpack);

		expect(publicPath).toBe('');
	});

	it('Initialize the getOutputPath function', () => {
		const outputPath = chunksWebpackPlugin.getOutputPath(compilationWebpack);

		expect(outputPath).toBe('/dist/templates');
	});

	it('Initialize the getOutputPath function with default outputPath', () => {
		chunksWebpackPlugin.options.outputPath = 'default';
		const outputPath = chunksWebpackPlugin.getOutputPath(compilationWebpack);

		expect(outputPath).toBe('/dist/');
	});

	it('Initialize the getOutputPath function with default outputPath and without value', () => {
		compilationWebpack.options.output.path = false;
		chunksWebpackPlugin.options.outputPath = 'default';
		const outputPath = chunksWebpackPlugin.getOutputPath(compilationWebpack);

		expect(outputPath).toBe('');
	});

	it('Initialize the getOutputPath function with wrong outputPath', () => {
		utils.setError = jest.fn();

		chunksWebpackPlugin.options.outputPath = '';
		chunksWebpackPlugin.getOutputPath(compilationWebpack);

		expect(utils.setError).toHaveBeenCalled();
	});

	it('Initialize the sortsChunksByType function', () => {
		expect(chunksSorted).toMatchObject({
			styles: ['/dist/css/vendors~app-a~app-b~app-c.css', '/dist/css/app-a.css'],
			scripts: ['/dist/js/vendors~app-a~app-b~app-c.js', '/dist/js/app-a.js']
		});
	});

	it('Initialize the sortsChunksByType function with scripts only', () => {
		const chunksSorted = chunksWebpackPlugin.sortsChunksByType({
			files: ['/dist/css/vendors~app-a~app-b~app-c.css', '/dist/css/app-a.css'],
			publicPath: chunksWebpackPlugin.getPublicPath(compilationWebpack)
		});

		expect(chunksSorted.scripts.length).toEqual(0);
	});

	it('Initialize the generateTags function', () => {
		const tags = chunksWebpackPlugin.generateTags(chunksSorted);

		expect(tags).toMatchObject({
			styles:
				'<link rel="stylesheet" href="/dist/css/vendors~app-a~app-b~app-c.css" /><link rel="stylesheet" href="/dist/css/app-a.css" />',
			scripts:
				'<script src="/dist/js/vendors~app-a~app-b~app-c.js"></script><script src="/dist/js/app-a.js"></script>'
		});
	});

	it('Initialize the createHtmlChunksFiles function', () => {
		utils.writeFile = jest.fn();

		chunksWebpackPlugin.createHtmlChunksFiles({
			entry: 'app-a',
			tagsHTML: {
				styles:
					'<link rel="stylesheet" href="/dist/css/vendors~app-a~app-b~app-c.css" /><link rel="stylesheet" href="/dist/css/app-a.css" />',
				scripts:
					'<script src="/dist/js/vendors~app-a~app-b~app-c.js"></script><script src="/dist/js/app-a.js"></script>'
			},
			outputPath: '/dist/'
		});

		expect(utils.writeFile).toHaveBeenCalled();
	});

	it('Initialize the createHtmlChunksFiles function without styles and scripts', () => {
		utils.writeFile = jest.fn();

		chunksWebpackPlugin.createHtmlChunksFiles({
			entry: 'app-a',
			tagsHTML: {
				styles: '',
				scripts: ''
			},
			outputPath: '/dist/'
		});

		expect(utils.writeFile).not.toHaveBeenCalled();
	});

	it('Initialize the createChunksManifestFile function', () => {
		updateManifest();
		chunksWebpackPlugin.createChunksManifestFile(compilationWebpack);
		const source = compilationWebpack.assets['chunks-manifest.json'].source();
		const size = compilationWebpack.assets['chunks-manifest.json'].size();

		expect(Object.keys(compilationWebpack.assets)).toEqual(['chunks-manifest.json']);
		expect(Object.keys(compilationWebpack.assets['chunks-manifest.json'])).toEqual([
			'source',
			'size'
		]);
		expect(source).toEqual(
			JSON.stringify(
				{
					'app-a': {
						styles: ['/dist/css/vendors~app-a~app-b~app-c.css', '/dist/css/app-a.css'],
						scripts: ['/dist/js/vendors~app-a~app-b~app-c.js', '/dist/js/app-a.js']
					}
				},
				null,
				2
			)
		);
		expect(size).toEqual(216);
	});

	it('Initialize sortsChunksByType function ignore source map file', () => {
		chunksWebpackPlugin.updateManifest = jest.fn();
		chunksWebpackPlugin.createHtmlChunksFiles = jest.fn();

		const chunksSorted = chunksWebpackPlugin.sortsChunksByType({
			files: compilationWebpack.entrypoints.get('app-a').getFiles(),
			publicPath: chunksWebpackPlugin.getPublicPath(compilationWebpack)
		});

		expect(chunksSorted).toEqual({
			styles: ['/dist/css/vendors~app-a~app-b~app-c.css', '/dist/css/app-a.css'],
			scripts: ['/dist/js/vendors~app-a~app-b~app-c.js', '/dist/js/app-a.js']
		});
	});
});
