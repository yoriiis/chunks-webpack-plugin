'use strict';

import ChunksWebpackPlugin from '../index';
import utils from '../utils';
import {
	mockGetEntryNames,
	mockGetFiles,
	mockHasCustomFormatTags,
	mockGetHtmlTags,
	mockSortsChunksByType,
	mockCustomFormatTags,
	mockIsValidOutputPath,
	mockIsPublicPathNeedsEndingSlash,
	mockIsValidCustomFormatTagsDatas,
	mockIsAbsolutePath
} from '../__mocks__/mocks';

let chunksWebpackPlugin;
let compilationWebpack;
let entryNames;
let files;
let chunks;
let htmlTags;
let Entrypoint;

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
	Entrypoint = entrypointsMap.get('app-a');
	entryNames = ['app-a', 'app-b', 'app-c'];
	files = entrypointsMap.get('app-a').chunks.files;
	chunks = {
		styles: ['css/vendors~app-a~app-b~app-c.css', 'css/app-a.css'],
		scripts: ['js/vendors~app-a~app-b~app-c.js', 'js/app-a.js']
	};
	htmlTags = {
		styles:
			'<link rel="stylesheet" href="https://cdn.domain.comcss/vendors~app-a~app-b~app-c.css" /><link rel="stylesheet" href="https://cdn.domain.comcss/app-a.css" />',
		scripts:
			'<script defer src="https://cdn.domain.comjs/vendors~app-a~app-b~app-c.js"></script><script defer src="https://cdn.domain.comjs/app-a.js"></script>'
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
});

describe('ChunksWebpackPlugin constructor', () => {
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
			outputPath: null,
			fileExtension: '.html',
			templateStyle: '<link rel="stylesheet" href="{{chunk}}" />',
			templateScript: '<script src="{{chunk}}"></script>',
			generateChunksManifest: false,
			generateChunksFiles: true,
			customFormatTags: false
		});
		expect(chunksWebpackPlugin.manifest).toEqual({});
	});
});

describe('ChunksWebpackPlugin apply', () => {
	it('Should call the apply function', () => {
		const compilerWebpack = {
			hooks: {
				emit: {
					tap: () => {}
				}
			}
		};
		compilerWebpack.hooks.emit.tap = jest.fn();

		chunksWebpackPlugin.apply(compilerWebpack);

		expect(compilerWebpack.hooks.emit.tap).toHaveBeenCalled();
	});
});

describe('ChunksWebpackPlugin hookCallback', () => {
	it('Should call the hookCallback function', () => {
		chunksWebpackPlugin.getPublicPath = jest.fn();
		chunksWebpackPlugin.getOutputPath = jest.fn();
		mockGetEntryNames(chunksWebpackPlugin, entryNames);
		mockGetFiles(chunksWebpackPlugin, files);
		chunksWebpackPlugin.processEntry = jest.fn();
		chunksWebpackPlugin.createChunksManifestFile = jest.fn();

		chunksWebpackPlugin.hookCallback(compilationWebpack);

		expect(chunksWebpackPlugin.getPublicPath).toHaveBeenCalled();
		expect(chunksWebpackPlugin.getOutputPath).toHaveBeenCalled();
		expect(chunksWebpackPlugin.getEntryNames).toHaveBeenCalled();
		expect(chunksWebpackPlugin.getFiles).toHaveBeenCalledTimes(3);
		expect(chunksWebpackPlugin.getFiles).toHaveBeenCalledWith('app-a');
		expect(chunksWebpackPlugin.getFiles).toHaveBeenCalledWith('app-b');
		expect(chunksWebpackPlugin.getFiles).toHaveBeenCalledWith('app-c');
		expect(chunksWebpackPlugin.processEntry).toHaveBeenCalledTimes(3);
		expect(chunksWebpackPlugin.processEntry).toHaveBeenCalledWith('app-a');
		expect(chunksWebpackPlugin.processEntry).toHaveBeenCalledWith('app-b');
		expect(chunksWebpackPlugin.processEntry).toHaveBeenCalledWith('app-c');
		expect(chunksWebpackPlugin.createChunksManifestFile).toHaveBeenCalled();
	});

	it('Should call the hookCallback function without generateChunksManifest', () => {
		chunksWebpackPlugin.getPublicPath = jest.fn();
		chunksWebpackPlugin.getOutputPath = jest.fn();
		mockGetEntryNames(chunksWebpackPlugin, entryNames);
		mockGetFiles(chunksWebpackPlugin, files);
		chunksWebpackPlugin.processEntry = jest.fn();
		chunksWebpackPlugin.createChunksManifestFile = jest.fn();

		chunksWebpackPlugin.options.generateChunksManifest = false;
		chunksWebpackPlugin.hookCallback(compilationWebpack);

		expect(chunksWebpackPlugin.createChunksManifestFile).not.toHaveBeenCalled();
	});
});

describe('ChunksWebpackPlugin processEntry', () => {
	it('Should call the processEntry function', () => {
		mockGetFiles(chunksWebpackPlugin, files);
		mockSortsChunksByType(chunksWebpackPlugin, chunks);
		mockGetHtmlTags(chunksWebpackPlugin, htmlTags);
		chunksWebpackPlugin.createHtmlChunksFiles = jest.fn();
		chunksWebpackPlugin.updateManifest = jest.fn();

		chunksWebpackPlugin.compilation = compilationWebpack;
		jest.spyOn(chunksWebpackPlugin.compilation.entrypoints, 'get');

		chunksWebpackPlugin.processEntry('app-a');

		expect(chunksWebpackPlugin.getFiles).toHaveBeenCalledWith('app-a');
		expect(chunksWebpackPlugin.sortsChunksByType).toHaveBeenCalledWith(files);
		expect(chunksWebpackPlugin.compilation.entrypoints.get).toHaveBeenCalledWith('app-a');
		expect(chunksWebpackPlugin.getHtmlTags).toHaveBeenCalledWith({
			chunks,
			Entrypoint
		});
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
		chunksWebpackPlugin.compilation = compilationWebpack;
		chunksWebpackPlugin.processEntry('app-a');

		expect(chunksWebpackPlugin.createHtmlChunksFiles).not.toHaveBeenCalled();
		expect(chunksWebpackPlugin.updateManifest).not.toHaveBeenCalled();
	});
});

describe('ChunksWebpackPlugin getPublicPath', () => {
	it('Should call the getPublicPath function', () => {
		chunksWebpackPlugin.isPublicPathNeedsEndingSlash = jest.fn();

		chunksWebpackPlugin.compilation = compilationWebpack;

		expect(chunksWebpackPlugin.getPublicPath()).toBe('/dist');
		expect(chunksWebpackPlugin.isPublicPathNeedsEndingSlash).toHaveBeenCalledWith(
			compilationWebpack.options.output.publicPath
		);
	});

	it('Should call the getPublicPath function and update the publicPath', () => {
		mockIsPublicPathNeedsEndingSlash(chunksWebpackPlugin, true);

		chunksWebpackPlugin.compilation = compilationWebpack;

		expect(chunksWebpackPlugin.getPublicPath()).toBe('/dist/');
		expect(chunksWebpackPlugin.isPublicPathNeedsEndingSlash).toHaveBeenCalledWith(
			compilationWebpack.options.output.publicPath
		);
	});

	it('Should call the getPublicPath function with empty string', () => {
		chunksWebpackPlugin.isPublicPathNeedsEndingSlash = jest.fn();

		chunksWebpackPlugin.compilation = compilationWebpack;
		chunksWebpackPlugin.compilation.options.output.publicPath = undefined;

		expect(chunksWebpackPlugin.getPublicPath()).toBe('');
	});
});

describe('ChunksWebpackPlugin getOutputPath', () => {
	it('Should call the getOutputPath function with valid outputPath', () => {
		mockIsValidOutputPath(chunksWebpackPlugin, true);

		const result = chunksWebpackPlugin.getOutputPath();

		expect(chunksWebpackPlugin.isValidOutputPath).toHaveBeenCalled();
		expect(result).toBe('/dist/templates');
	});

	it('Should call the getOutputPath function with invalid outputPath', () => {
		mockIsValidOutputPath(chunksWebpackPlugin, false);

		chunksWebpackPlugin.compilation = compilationWebpack;
		const result = chunksWebpackPlugin.getOutputPath();

		expect(chunksWebpackPlugin.isValidOutputPath).toHaveBeenCalled();
		expect(result).toBe(compilationWebpack.options.output.path);
	});

	it('Should call the getOutputPath function with invalid outputPath and empty output path', () => {
		mockIsValidOutputPath(chunksWebpackPlugin, false);

		compilationWebpack.options.output.path = null;
		chunksWebpackPlugin.compilation = compilationWebpack;
		const result = chunksWebpackPlugin.getOutputPath();

		expect(chunksWebpackPlugin.isValidOutputPath).toHaveBeenCalled();
		expect(result).toBe('');
	});
});

describe('ChunksWebpackPlugin getEntryNames', () => {
	it('Should call the getEntryNames function', () => {
		chunksWebpackPlugin.compilation = compilationWebpack;

		expect(chunksWebpackPlugin.getEntryNames()).toEqual(['app-a', 'app-b', 'app-c']);
	});
});

describe('ChunksWebpackPlugin getFiles', () => {
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
});

describe('ChunksWebpackPlugin getHtmlTags', () => {
	it('Should call the getHtmlTags function with default generate tag', () => {
		chunksWebpackPlugin.formatTags = jest.fn();

		chunksWebpackPlugin.options.customFormatTags = false;
		chunksWebpackPlugin.getHtmlTags({ chunks, files });

		expect(chunksWebpackPlugin.formatTags).toHaveBeenCalled();
	});

	it('Should call the getHtmlTags function with customFormatTags', () => {
		mockHasCustomFormatTags(chunksWebpackPlugin, true);
		mockCustomFormatTags(chunksWebpackPlugin, htmlTags);
		mockIsValidCustomFormatTagsDatas(chunksWebpackPlugin, true);

		chunksWebpackPlugin.getHtmlTags({ chunks, Entrypoint });

		expect(chunksWebpackPlugin.options.customFormatTags).toHaveBeenCalledWith(
			chunks,
			Entrypoint
		);
		expect(chunksWebpackPlugin.isValidCustomFormatTagsDatas).toHaveBeenCalledWith(htmlTags);
	});

	it('Should call the getHtmlTags function with customFormatTags and invalid return', () => {
		mockHasCustomFormatTags(chunksWebpackPlugin, true);
		mockCustomFormatTags(chunksWebpackPlugin, htmlTags);
		utils.setError = jest.fn();
		mockIsValidCustomFormatTagsDatas(chunksWebpackPlugin, false);

		chunksWebpackPlugin.getHtmlTags({ chunks, Entrypoint });

		expect(chunksWebpackPlugin.isValidCustomFormatTagsDatas).toHaveBeenCalledWith(htmlTags);
		expect(utils.setError).toHaveBeenCalledWith(
			'ChunksWebpackPlugin::customFormatTags return invalid object'
		);
	});
});

describe('ChunksWebpackPlugin sortsChunksByType', () => {
	it('Should call the sortsChunksByType function', () => {
		let publicPath = compilationWebpack.options.output.publicPath;
		if (publicPath.substr(-1) !== '/') {
			publicPath = `${publicPath}/`;
		}
		chunksWebpackPlugin.publicPath = publicPath;

		expect(chunksWebpackPlugin.sortsChunksByType(files)).toEqual({
			scripts: ['/dist/js/vendors~app-a~app-b~app-c.js', '/dist/js/app-a.js'],
			styles: ['/dist/css/vendors~app-a~app-b~app-c.css', '/dist/css/app-a.css']
		});
	});
});

describe('ChunksWebpackPlugin formatTags', () => {
	it('Should call the formatTags function', () => {
		expect(chunksWebpackPlugin.formatTags(chunks)).toEqual({
			styles:
				'<link rel="stylesheet" href="css/vendors~app-a~app-b~app-c.css" /><link rel="stylesheet" href="css/app-a.css" />',
			scripts:
				'<script src="js/vendors~app-a~app-b~app-c.js"></script><script src="js/app-a.js"></script>'
		});
	});

	it('Should call the formatTags function with custom templateStyle and templateScript', () => {
		chunksWebpackPlugin.options.templateStyle =
			'<link rel="stylesheet" href="https://cdn.domain.com/{{chunk}}" />';
		chunksWebpackPlugin.options.templateScript =
			'<script defer src="https://cdn.domain.com/{{chunk}}"></script>';

		expect(chunksWebpackPlugin.formatTags(chunks)).toEqual({
			styles:
				'<link rel="stylesheet" href="https://cdn.domain.com/css/vendors~app-a~app-b~app-c.css" /><link rel="stylesheet" href="https://cdn.domain.com/css/app-a.css" />',
			scripts:
				'<script defer src="https://cdn.domain.com/js/vendors~app-a~app-b~app-c.js"></script><script defer src="https://cdn.domain.com/js/app-a.js"></script>'
		});
	});
});

describe('ChunksWebpackPlugin isPublicPathNeedsEndingSlash', () => {
	it('Should call the isPublicPathNeedsEndingSlash function without ending slash', () => {
		expect(chunksWebpackPlugin.isPublicPathNeedsEndingSlash('/dist')).toBe(true);
	});

	it('Should call the isPublicPathNeedsEndingSlash function with ending slash', () => {
		expect(chunksWebpackPlugin.isPublicPathNeedsEndingSlash('/dist/')).toBe(false);
	});
});

describe('ChunksWebpackPlugin isValidOutputPath', () => {
	it('Should call the isValidOutputPath function with absolute path', () => {
		mockIsAbsolutePath(true);

		expect(chunksWebpackPlugin.isValidOutputPath()).toBe(true);
		expect(utils.isAbsolutePath).toHaveBeenCalledWith(chunksWebpackPlugin.options.outputPath);
	});

	it('Should call the isValidOutputPath function without absolute path', () => {
		mockIsAbsolutePath(false);

		expect(chunksWebpackPlugin.isValidOutputPath()).toBe(false);
	});
});

describe('ChunksWebpackPlugin isValidExtensionByType', () => {
	it('Should call the isValidExtensionByType function', () => {
		expect(
			chunksWebpackPlugin.isValidExtensionByType('css/vendors~app-a~app-b~app-c.css', 'css')
		).toBe(true);
		expect(
			chunksWebpackPlugin.isValidExtensionByType('js/vendors~app-a~app-b~app-c.js', 'js')
		).toBe(true);
	});
});

describe('ChunksWebpackPlugin isValidCustomFormatTagsDatas', () => {
	it('Should call the isValidCustomFormatTagsDatas function', () => {
		expect(chunksWebpackPlugin.isValidCustomFormatTagsDatas(htmlTags)).toBe(true);
	});
});

describe('ChunksWebpackPlugin updateManifest', () => {
	it('Should call the updateManifest function', () => {
		chunksWebpackPlugin.updateManifest({
			entryName: 'app-a',
			chunks
		});

		expect(chunksWebpackPlugin.manifest).toEqual({
			'app-a': chunks
		});
	});
});

describe('ChunksWebpackPlugin createChunksManifestFile', () => {
	it('Should call the createChunksManifestFile function', () => {
		chunksWebpackPlugin.compilation = compilationWebpack;
		chunksWebpackPlugin.manifest = {
			'app-a': chunks
		};
		const output = JSON.stringify(chunksWebpackPlugin.manifest, null, 2);

		chunksWebpackPlugin.createChunksManifestFile();

		expect(chunksWebpackPlugin.compilation.assets).toEqual({
			'chunks-manifest.json': {
				source: expect.any(Function),
				size: expect.any(Function)
			}
		});
		expect(chunksWebpackPlugin.compilation.assets['chunks-manifest.json'].source()).toBe(
			output
		);
		expect(chunksWebpackPlugin.compilation.assets['chunks-manifest.json'].size()).toBe(
			output.length
		);
	});
});

describe('ChunksWebpackPlugin createHtmlChunksFiles', () => {
	it('Should call the createHtmlChunksFiles function', () => {
		utils.writeFile = jest.fn();

		chunksWebpackPlugin.outputPath = '/dist/templates';
		chunksWebpackPlugin.createHtmlChunksFiles({
			entryName: 'app-a',
			htmlTags: {
				styles: '',
				scripts: ''
			}
		});

		expect(utils.writeFile).not.toHaveBeenCalled();
	});

	it('Should call the createHtmlChunksFiles function without scripts and styles', () => {
		utils.writeFile = jest.fn();

		chunksWebpackPlugin.outputPath = '/dist/templates';
		chunksWebpackPlugin.createHtmlChunksFiles({
			entryName: 'app-a',
			htmlTags
		});

		expect(utils.writeFile).toHaveBeenCalledTimes(2);
		expect(utils.writeFile).toHaveBeenCalledWith({
			outputPath: '/dist/templates/app-a-scripts.html',
			output: htmlTags.scripts
		});
		expect(utils.writeFile).toHaveBeenCalledWith({
			outputPath: '/dist/templates/app-a-styles.html',
			output: htmlTags.styles
		});
	});
});
