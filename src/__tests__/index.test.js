'use strict';

import ChunksWebpackPlugin from '../index';
import utils from '../utils';
import {
	mockGetEntryName,
	mockGetFiles,
	mockHasCustomFormatTags,
	mockGetHtmlTags,
	mockCustomFormatTags,
	mockIsValidCustomFormatTagsDatas
} from './mocks';
// import fse from 'fs-extra';

let chunksWebpackPlugin;
// let chunksSorted;
let compilationWebpack;
let compilerWebpack;

let files;
let chunks;
let htmlTags;

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

// const getChunksSorted = () => {
// 	return chunksWebpackPlugin.sortsChunksByType({
// 		files: compilationWebpack.entrypoints.get('app-a').getFiles(),
// 		publicPath: chunksWebpackPlugin.getPublicPath(compilationWebpack)
// 	});
// };

// function updateManifest () {
// 	chunksWebpackPlugin.updateManifest({
// 		entryName: Array.from(compilationWebpack.entrypoints.keys())[0],
// 		chunks: chunksSorted
// 	});
// }

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
	files = ['css/app-a.css', 'js/app-a.js', 'css/app-b.css', 'js/app-b.js'];
	chunks = {
		styles: ['css/app-a.css', 'css/app-b.css'],
		scripts: ['js/app-a.js', 'js/app-b.js']
	};
	htmlTags = {
		styles:
			'<link rel="stylesheet" href="https://cdn.domain.comcss/vendors~app-a~app-b~app-c.css" /><link rel="stylesheet" href="https://cdn.domain.comcss/app-a.css" />',
		scripts:
			'<script defer src="https://cdn.domain.comjs/vendors~app-a~app-b~app-c.js"></script><script defer src="https://cdn.domain.comjs/app-a.js"></script>'
	};

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
	// chunksSorted = getChunksSorted();
});

describe('ChunksWebpackPlugin', () => {
	it('Should initialize the constructor with custom options', () => {
		expect(chunksWebpackPlugin.options).toMatchObject({
			outputPath: '/dist/templates',
			fileExtension: '.html',
			templateStyle: '<link rel="stylesheet" href="{{chunk}}" />',
			templateScript: '<script src="{{chunk}}"></script>',
			generateChunksManifest: true,
			generateChunksFiles: true,
			customFormatTags: expect.any(Function)
		});
		expect(chunksWebpackPlugin.manifest).toEqual({});
	});

	it('Should initialize the constructor with default options', () => {
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
		expect(chunksWebpackPlugin.manifest).toEqual({});
	});

	it('Should call the apply function', () => {
		compilerWebpack.hooks.emit.tap = jest.fn();

		chunksWebpackPlugin.apply(compilerWebpack);

		expect(compilerWebpack.hooks.emit.tap).toHaveBeenCalled();
	});

	it('Should call the hookCallback function', () => {
		chunksWebpackPlugin.getPublicPath = jest.fn();
		chunksWebpackPlugin.getOutputPath = jest.fn();
		mockGetEntryName(chunksWebpackPlugin);
		mockGetFiles(chunksWebpackPlugin, files);
		chunksWebpackPlugin.processEntry = jest.fn();
		chunksWebpackPlugin.createChunksManifestFile = jest.fn();

		chunksWebpackPlugin.hookCallback(compilationWebpack);

		expect(chunksWebpackPlugin.getPublicPath).toHaveBeenCalled();
		expect(chunksWebpackPlugin.getOutputPath).toHaveBeenCalled();
		expect(chunksWebpackPlugin.getEntryNames).toHaveBeenCalled();
		expect(chunksWebpackPlugin.getFiles).toHaveBeenCalledTimes(2);
		expect(chunksWebpackPlugin.getFiles).toHaveBeenCalledWith('app-a');
		expect(chunksWebpackPlugin.getFiles).toHaveBeenCalledWith('app-b');
		expect(chunksWebpackPlugin.processEntry).toHaveBeenCalledTimes(2);
		expect(chunksWebpackPlugin.processEntry).toHaveBeenCalledWith('app-a');
		expect(chunksWebpackPlugin.processEntry).toHaveBeenCalledWith('app-b');
		expect(chunksWebpackPlugin.createChunksManifestFile).toHaveBeenCalled();
	});

	it('Should call the hookCallback function without generateChunksManifest', () => {
		chunksWebpackPlugin.getPublicPath = jest.fn();
		chunksWebpackPlugin.getOutputPath = jest.fn();
		mockGetEntryName(chunksWebpackPlugin);
		chunksWebpackPlugin.createChunksManifestFile = jest.fn();

		chunksWebpackPlugin.options.generateChunksManifest = false;
		chunksWebpackPlugin.hookCallback(compilationWebpack);

		expect(chunksWebpackPlugin.createChunksManifestFile).not.toHaveBeenCalled();
	});

	it('Should call the processEntry function', () => {
		mockGetFiles(chunksWebpackPlugin, files);
		chunksWebpackPlugin.sortsChunksByType = jest.fn().mockImplementation(() => {
			return chunks;
		});
		mockGetHtmlTags(chunksWebpackPlugin, htmlTags);
		chunksWebpackPlugin.createHtmlChunksFiles = jest.fn();
		chunksWebpackPlugin.updateManifest = jest.fn();

		chunksWebpackPlugin.processEntry('app-a');

		expect(chunksWebpackPlugin.getFiles).toHaveBeenCalledWith('app-a');
		expect(chunksWebpackPlugin.sortsChunksByType).toHaveBeenCalledWith(files);
		expect(chunksWebpackPlugin.getHtmlTags).toHaveBeenCalledWith({ chunks, files });
		expect(chunksWebpackPlugin.createHtmlChunksFiles).toHaveBeenCalledWith({
			entryName: 'app-a',
			htmlTags: htmlTags
		});
		expect(chunksWebpackPlugin.updateManifest).toHaveBeenCalledWith({
			entryName: 'app-a',
			chunks
		});
	});

	it('Should call the processEntry function without generateChunksFiles and without generateChunksManifest', () => {
		chunksWebpackPlugin.getFiles = jest.fn();
		chunksWebpackPlugin.sortsChunksByType = jest.fn();
		chunksWebpackPlugin.getHtmlTags = jest.fn();
		chunksWebpackPlugin.createHtmlChunksFiles = jest.fn();
		chunksWebpackPlugin.updateManifest = jest.fn();

		chunksWebpackPlugin.options.generateChunksFiles = false;
		chunksWebpackPlugin.options.generateChunksManifest = false;
		chunksWebpackPlugin.processEntry('app-a');

		expect(chunksWebpackPlugin.createHtmlChunksFiles).not.toHaveBeenCalled();
		expect(chunksWebpackPlugin.updateManifest).not.toHaveBeenCalled();
	});

	it('Should call the getHtmlTags function with default generate tag', () => {
		chunksWebpackPlugin.hasCustomFormatTags = jest.fn();
		chunksWebpackPlugin.generateTags = jest.fn();

		chunksWebpackPlugin.getHtmlTags({ chunks, files });

		expect(chunksWebpackPlugin.hasCustomFormatTags).toHaveBeenCalled();
		expect(chunksWebpackPlugin.generateTags).toHaveBeenCalled();
	});

	it('Should call the getHtmlTags function with customFormatTags', () => {
		mockHasCustomFormatTags(chunksWebpackPlugin, chunks);
		mockCustomFormatTags(chunksWebpackPlugin, htmlTags);
		mockIsValidCustomFormatTagsDatas(chunksWebpackPlugin, true);

		chunksWebpackPlugin.getHtmlTags({ chunks, files });

		expect(chunksWebpackPlugin.hasCustomFormatTags).toHaveBeenCalled();
		expect(chunksWebpackPlugin.options.customFormatTags).toHaveBeenCalledWith(chunks, files);
		expect(chunksWebpackPlugin.isValidCustomFormatTagsDatas).toHaveBeenCalledWith(htmlTags);
	});

	it('Should call the getHtmlTags function with customFormatTags and invalid return', () => {
		mockHasCustomFormatTags(chunksWebpackPlugin, chunks);
		mockCustomFormatTags(chunksWebpackPlugin, htmlTags);
		utils.setError = jest.fn();
		mockIsValidCustomFormatTagsDatas(chunksWebpackPlugin, false);

		chunksWebpackPlugin.getHtmlTags({ chunks, files });

		expect(chunksWebpackPlugin.hasCustomFormatTags).toHaveBeenCalled();
		expect(chunksWebpackPlugin.isValidCustomFormatTagsDatas).toHaveBeenCalledWith(htmlTags);
		expect(utils.setError).toHaveBeenCalledWith(
			'ChunksWebpackPlugin::customFormatTags return invalid object'
		);
	});

	it('Should call the hasCustomFormatTags function', () => {
		expect(chunksWebpackPlugin.hasCustomFormatTags()).toBe(true);
	});

	it('Should call the hasCustomFormatTags function without customFormatTags', () => {
		chunksWebpackPlugin.options.customFormatTags = false;

		expect(chunksWebpackPlugin.hasCustomFormatTags()).toBe(false);
	});

	it('Should call the getPublicPath function', () => {
		chunksWebpackPlugin.publicPathNeedEndingSlash = jest.fn();

		chunksWebpackPlugin.compilation = compilationWebpack;

		expect(chunksWebpackPlugin.getPublicPath()).toBe('/dist');
		expect(chunksWebpackPlugin.publicPathNeedEndingSlash).toHaveBeenCalledWith(
			compilationWebpack.options.output.publicPath
		);
	});

	it('Should call the getPublicPath function and update the publicPath', () => {
		chunksWebpackPlugin.publicPathNeedEndingSlash = jest.fn().mockImplementation(() => {
			return true;
		});

		chunksWebpackPlugin.compilation = compilationWebpack;

		expect(chunksWebpackPlugin.getPublicPath()).toBe('/dist/');
		expect(chunksWebpackPlugin.publicPathNeedEndingSlash).toHaveBeenCalledWith(
			compilationWebpack.options.output.publicPath
		);
	});

	it('Should call the getPublicPath function with empty string', () => {
		chunksWebpackPlugin.publicPathNeedEndingSlash = jest.fn();

		chunksWebpackPlugin.compilation = compilationWebpack;
		chunksWebpackPlugin.compilation.options.output.publicPath = undefined;

		expect(chunksWebpackPlugin.getPublicPath()).toBe('');
	});

	it('Should call the publicPathNeedEndingSlash function', () => {
		expect(chunksWebpackPlugin.publicPathNeedEndingSlash('/dist')).toBe(true);
	});

	it('Should call the getOutputPath function with default outputPath', () => {
		chunksWebpackPlugin.isDefaultOutputPath = jest.fn().mockImplementation(() => {
			return true;
		});

		chunksWebpackPlugin.compilation = compilationWebpack;

		expect(chunksWebpackPlugin.getOutputPath()).toBe('/dist/');
		expect(chunksWebpackPlugin.isDefaultOutputPath).toHaveBeenCalled();
	});

	it('Should call the getOutputPath function with default outputPath and empty outputPath', () => {
		chunksWebpackPlugin.isDefaultOutputPath = jest.fn().mockImplementation(() => {
			return true;
		});

		chunksWebpackPlugin.compilation = compilationWebpack;
		chunksWebpackPlugin.compilation.options.output.path = undefined;

		expect(chunksWebpackPlugin.getOutputPath()).toBe('');
	});

	it('Should call the getOutputPath function with valid option outputPath', () => {
		chunksWebpackPlugin.isDefaultOutputPath = jest.fn().mockImplementation(() => {
			return false;
		});
		chunksWebpackPlugin.isValidOutputPath = jest.fn().mockImplementation(() => {
			return true;
		});

		expect(chunksWebpackPlugin.getOutputPath()).toBe('/dist/templates');
		expect(chunksWebpackPlugin.isValidOutputPath).toHaveBeenCalled();
	});

	it('Should call the getOutputPath function with invalid outputPath', () => {
		chunksWebpackPlugin.isDefaultOutputPath = jest.fn().mockImplementation(() => {
			return false;
		});
		chunksWebpackPlugin.isValidOutputPath = jest.fn().mockImplementation(() => {
			return false;
		});

		chunksWebpackPlugin.getOutputPath();

		expect(utils.setError).toHaveBeenCalledWith(
			'ChunksWebpackPlugin::outputPath option is invalid'
		);
	});

	it('Should call the isDefaultOutputPath function without default outputPath', () => {
		expect(chunksWebpackPlugin.isDefaultOutputPath()).toBe(false);
	});

	it('Should call the isDefaultOutputPath function with default outputPath', () => {
		chunksWebpackPlugin.options.outputPath = 'default';
		expect(chunksWebpackPlugin.isDefaultOutputPath()).toBe(true);
	});

	it('Should call the isValidOutputPath function with absolute path', () => {
		utils.isAbsolutePath = jest.fn().mockImplementation(() => {
			return true;
		});

		expect(chunksWebpackPlugin.isValidOutputPath()).toBe(true);
		expect(utils.isAbsolutePath).toHaveBeenCalledWith(chunksWebpackPlugin.options.outputPath);
	});

	it('Should call the isValidOutputPath function without absolute path', () => {
		utils.isAbsolutePath = jest.fn().mockImplementation(() => {
			return false;
		});

		expect(chunksWebpackPlugin.isValidOutputPath()).toBe(false);
	});

	it('Should call the getEntryNames function', () => {
		chunksWebpackPlugin.compilation = compilationWebpack;

		expect(chunksWebpackPlugin.getEntryNames()).toEqual(['app-a', 'app-b', 'app-c']);
	});

	it('Should call the getFiles function', () => {
		chunksWebpackPlugin.compilation = compilationWebpack;

		expect(chunksWebpackPlugin.getFiles('app-a')).toEqual([
			'css/vendors~app-a~app-b~app-c.css',
			'js/vendors~app-a~app-b~app-c.js',
			'css/vendors~app-a~app-b~app-c.css.map',
			'js/vendors~app-a~app-b~app-c.js.map',
			'css/app-a.css',
			'js/app-a.js',
			'css/app-a.css.map',
			'js/app-a.js.map'
		]);
	});

	it('Should call the sortsChunksByType function', () => {
		expect(chunksWebpackPlugin.sortsChunksByType(files)).toEqual({
			scripts: ['js/app-a.js', 'js/app-b.js'],
			styles: ['css/app-a.css', 'css/app-b.css']
		});
	});

	it('Should call the isValidExtensionByType function', () => {
		expect(
			chunksWebpackPlugin.isValidExtensionByType('css/vendors~app-a~app-b~app-c.css', 'css')
		).toBe(true);
		expect(
			chunksWebpackPlugin.isValidExtensionByType('js/vendors~app-a~app-b~app-c.js', 'js')
		).toBe(true);
	});

	it('Should call the isValidCustomFormatTagsDatas function', () => {
		expect(chunksWebpackPlugin.isValidCustomFormatTagsDatas(htmlTags)).toBe(true);
	});

	it('Should call the generateTags function', () => {
		expect(chunksWebpackPlugin.generateTags(chunks)).toEqual({
			styles:
				'<link rel="stylesheet" href="css/app-a.css" /><link rel="stylesheet" href="css/app-b.css" />',
			scripts: '<script src="js/app-a.js"></script><script src="js/app-b.js"></script>'
		});
	});

	it('Should call the generateTags function with custom templateScript', () => {
		chunksWebpackPlugin.options.templateScript = '<script defer src="{{chunk}}"></script>';

		expect(chunksWebpackPlugin.generateTags(chunks)).toEqual({
			styles:
				'<link rel="stylesheet" href="css/app-a.css" /><link rel="stylesheet" href="css/app-b.css" />',
			scripts:
				'<script defer src="js/app-a.js"></script><script defer src="js/app-b.js"></script>'
		});
	});
});
