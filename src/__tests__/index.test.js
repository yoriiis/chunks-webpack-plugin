import ChunksWebpackPlugin from '../index';
import {
	mockGetEntryNames,
	mockGetFiles,
	mockHasCustomFormatTags,
	mockGetHtmlTags,
	mockSortsChunksByType,
	mockCustomFormatTags,
	mockIsValidCustomFormatTagsDatas
} from '../__mocks__/mocks';
import path from 'path';

const webpack = require('webpack');

jest.mock('webpack', () => ({
	version: '5.4.0',
	Compilation: {
		PROCESS_ASSETS_STAGE_ADDITIONAL: ''
	},
	sources: {
		RawSource: jest.fn()
	}
}));

const { RawSource } = webpack.sources;

let chunksWebpackPlugin;
let compilationWebpack;
let mockFs;
let entryNames;
let files;
let chunks;
let htmlTags;
let Entrypoint;

const options = {
	filename: 'templates/[name]-[type].html',
	generateChunksManifest: true,
	generateChunksFiles: true,
	customFormatTags: (chunksSorted) => {
		// Generate all HTML style tags with CDN prefix
		const styles = chunksSorted.styles
			.map((chunkCss) => `<link rel="stylesheet" href="https://cdn.domain.com${chunkCss}" />`)
			.join('');

		// Generate all HTML style tags with CDN prefix and defer attribute
		const scripts = chunksSorted.scripts
			.map((chunkJs) => `<script defer src="https://cdn.domain.com${chunkJs}"></script>`)
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
const generateMockFs = ({ mkdirError, writeFileError } = {}) => ({
	mkdir: jest.fn().mockImplementation((path, options, callback) => {
		mkdirError ? callback(new Error('mkdir error')) : callback();
	}),
	writeFile: jest.fn().mockImplementation((path, output, callback) => {
		writeFileError ? callback(new Error('writeFile error')) : callback();
	})
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
		styles: '<link rel="stylesheet" href="https://cdn.domain.comcss/vendors~app-a~app-b~app-c.css" /><link rel="stylesheet" href="https://cdn.domain.comcss/app-a.css" />',
		scripts:
			'<script defer src="https://cdn.domain.comjs/vendors~app-a~app-b~app-c.js"></script><script defer src="https://cdn.domain.comjs/app-a.js"></script>'
	};

	mockFs = generateMockFs();

	compilationWebpack = {
		assets: {},
		entrypoints: entrypointsMap,
		options: {
			context: '/chunks-webpack-plugin/example',
			output: {
				path: '/chunks-webpack-plugin/example/dist',
				publicPath: '/dist/'
			}
		},
		compiler: {
			outputFileSystem: mockFs
		},
		emitAsset: jest.fn(),
		hooks: {
			processAssets: {
				tap: jest.fn()
			}
		}
	};

	chunksWebpackPlugin = getInstance();
});

describe('ChunksWebpackPlugin constructor', () => {
	it('Should initialize the constructor with custom options', () => {
		expect(chunksWebpackPlugin.options).toMatchObject({
			filename: 'templates/[name]-[type].html',
			templateStyle: '<link rel="stylesheet" href="{{chunk}}" />',
			templateScript: '<script src="{{chunk}}"></script>',
			outputPath: null,
			generateChunksManifest: true,
			generateChunksFiles: true,
			customFormatTags: expect.any(Function)
		});
		expect(chunksWebpackPlugin.manifest).toEqual({});
	});

	it('Should initialize the constructor with default options', () => {
		const instance = new ChunksWebpackPlugin();
		expect(instance.options).toStrictEqual({
			filename: '[name]-[type].html',
			templateStyle: '<link rel="stylesheet" href="{{chunk}}" />',
			templateScript: '<script src="{{chunk}}"></script>',
			outputPath: null,
			generateChunksManifest: false,
			generateChunksFiles: true,
			customFormatTags: false
		});
		expect(chunksWebpackPlugin.manifest).toEqual({});
	});
});

describe('ChunksWebpackPlugin apply', () => {
	it('Should call the apply function with webpack v5', () => {
		const compilerWebpack = {
			hooks: {
				thisCompilation: {
					tap: () => {
						// Empty
					}
				}
			}
		};
		compilerWebpack.hooks.thisCompilation.tap = jest.fn();

		webpack.version = '5.4.0';
		chunksWebpackPlugin.apply(compilerWebpack);

		expect(compilerWebpack.hooks.thisCompilation.tap).toHaveBeenCalled();
	});
});

describe('ChunksWebpackPlugin hookCallback', () => {
	it('Should call the hookCallback function with webpack v5', () => {
		chunksWebpackPlugin.addAssets = jest.fn();

		chunksWebpackPlugin.hookCallback(compilationWebpack);

		expect(chunksWebpackPlugin.addAssets).not.toHaveBeenCalled();
		expect(chunksWebpackPlugin.compilation.hooks.processAssets.tap).toHaveBeenCalledWith(
			{
				name: 'ChunksWebpackPlugin',
				stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
			},
			chunksWebpackPlugin.addAssets
		);
	});

	it('Should call the hookCallback function with webpack v5 and outputPath', () => {
		chunksWebpackPlugin.addAssets = jest.fn();

		chunksWebpackPlugin.options.outputPath = '/';
		chunksWebpackPlugin.hookCallback(compilationWebpack);

		expect(chunksWebpackPlugin.addAssets).not.toHaveBeenCalled();
		expect(chunksWebpackPlugin.compilation.hooks.processAssets.tap).toHaveBeenCalledWith(
			{
				name: 'ChunksWebpackPlugin',
				stage: Infinity
			},
			chunksWebpackPlugin.addAssets
		);
	});
});

describe('ChunksWebpackPlugin addAssets', () => {
	it('Should call the addAssets function', () => {
		chunksWebpackPlugin.getPublicPath = jest.fn().mockReturnValue('/dist/');
		chunksWebpackPlugin.getOutputPath = jest
			.fn()
			.mockReturnValue('/chunks-webpack-plugin/example/dist');
		chunksWebpackPlugin.getPathFromString = jest.fn().mockReturnValue('templates/');
		mockGetEntryNames(chunksWebpackPlugin, entryNames);
		mockGetFiles(chunksWebpackPlugin, files);
		chunksWebpackPlugin.processEntry = jest.fn();
		chunksWebpackPlugin.createChunksManifestFile = jest.fn();

		chunksWebpackPlugin.addAssets();

		expect(chunksWebpackPlugin.getPublicPath).toHaveBeenCalled();
		expect(chunksWebpackPlugin.getOutputPath).toHaveBeenCalled();
		expect(chunksWebpackPlugin.getPathFromString).toHaveBeenCalled();
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
		expect(chunksWebpackPlugin.publicPath).toBe('/dist/');
		expect(chunksWebpackPlugin.outputPath).toBe('/chunks-webpack-plugin/example/dist');
		expect(chunksWebpackPlugin.pathFromFilename).toBe('templates/');
	});

	it('Should call the addAssets function without generateChunksManifest', () => {
		chunksWebpackPlugin.getPublicPath = jest.fn();
		chunksWebpackPlugin.getOutputPath = jest.fn();
		mockGetEntryNames(chunksWebpackPlugin, entryNames);
		mockGetFiles(chunksWebpackPlugin, files);
		chunksWebpackPlugin.processEntry = jest.fn();
		chunksWebpackPlugin.createChunksManifestFile = jest.fn();

		chunksWebpackPlugin.options.generateChunksManifest = false;

		chunksWebpackPlugin.addAssets();

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
			htmlTags
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
	it('Should call the getPublicPath function with a string', () => {
		chunksWebpackPlugin.isPublicPathNeedsEndingSlash = jest.fn().mockReturnValue(false);

		chunksWebpackPlugin.compilation = compilationWebpack;

		expect(chunksWebpackPlugin.getPublicPath()).toBe('/dist/');
		expect(chunksWebpackPlugin.isPublicPathNeedsEndingSlash).toHaveBeenCalledWith(
			compilationWebpack.options.output.publicPath
		);
	});

	it('Should call the getPublicPath function with the default value "auto"', () => {
		chunksWebpackPlugin.isPublicPathNeedsEndingSlash = jest.fn().mockReturnValue(true);

		compilationWebpack.options.output.publicPath = 'auto';
		chunksWebpackPlugin.compilation = compilationWebpack;

		expect(chunksWebpackPlugin.getPublicPath()).toBe('/dist/');
		expect(chunksWebpackPlugin.isPublicPathNeedsEndingSlash).toHaveBeenCalledWith('/dist');
	});

	it('Should call the getPublicPath function and add the leading slash', () => {
		chunksWebpackPlugin.isPublicPathNeedsEndingSlash = jest.fn().mockReturnValue(true);

		chunksWebpackPlugin.compilation = compilationWebpack;
		chunksWebpackPlugin.compilation.options.output.publicPath = '/dist';

		expect(chunksWebpackPlugin.getPublicPath()).toBe('/dist/');
		expect(chunksWebpackPlugin.isPublicPathNeedsEndingSlash).toHaveBeenCalledWith(
			chunksWebpackPlugin.compilation.options.output.publicPath
		);
	});

	it('Should call the getPublicPath function with an undefined value', () => {
		chunksWebpackPlugin.isPublicPathNeedsEndingSlash = jest.fn();

		chunksWebpackPlugin.compilation = compilationWebpack;
		chunksWebpackPlugin.compilation.options.output.publicPath = undefined;

		expect(chunksWebpackPlugin.getPublicPath()).toBe('');
	});

	it('Should call the getPublicPath function with a function', () => {
		chunksWebpackPlugin.isPublicPathNeedsEndingSlash = jest.fn();

		chunksWebpackPlugin.compilation = compilationWebpack;
		chunksWebpackPlugin.compilation.options.output.publicPath = () => '/dist/';

		expect(chunksWebpackPlugin.getPublicPath()).toBe('/dist/');
	});
});

describe('ChunksWebpackPlugin getOutputPath', () => {
	it('Should call the getOutputPath function with a valid outputPath from options', () => {
		chunksWebpackPlugin.isValidOutputPath = jest.fn().mockReturnValue(true);

		chunksWebpackPlugin.compilation = compilationWebpack;
		chunksWebpackPlugin.options.outputPath = '/chunks-webpack-plugin/example/dist/templates';
		const result = chunksWebpackPlugin.getOutputPath();

		expect(chunksWebpackPlugin.isValidOutputPath).toHaveBeenCalled();
		expect(result).toBe('/chunks-webpack-plugin/example/dist/templates');
	});

	it('Should call the getOutputPath function with an invalid outputPath from options', () => {
		chunksWebpackPlugin.compilation = compilationWebpack;
		chunksWebpackPlugin.options.outputPath = 'chunks-webpack-plugin/example/dist/templates';
		const result = chunksWebpackPlugin.getOutputPath();

		expect(result).toBe('/chunks-webpack-plugin/example/dist');
	});

	it('Should call the getOutputPath function with an undefined value', () => {
		chunksWebpackPlugin.compilation = compilationWebpack;
		chunksWebpackPlugin.compilation.options.output.path = undefined;
		const result = chunksWebpackPlugin.getOutputPath();

		expect(result).toBe('');
	});
});

describe('ChunksWebpackPlugin getPathFromString', () => {
	it('Should call the getPathFromString function with an outpath inside the filename', () => {
		chunksWebpackPlugin.compilation = compilationWebpack;
		const result = chunksWebpackPlugin.getPathFromString(chunksWebpackPlugin.options.filename);

		expect(result).toBe('templates/');
	});

	it('Should call the getPathFromString function with a filename that starts with a slashe', () => {
		chunksWebpackPlugin.compilation = compilationWebpack;
		chunksWebpackPlugin.options.filename = '/[name]-[type].html';
		const result = chunksWebpackPlugin.getPathFromString(chunksWebpackPlugin.options.filename);

		expect(result).toBe('');
	});

	it('Should call the getPathFromString function without an outpath inside the filename', () => {
		chunksWebpackPlugin.compilation = compilationWebpack;
		chunksWebpackPlugin.options.filename = '[name]-[type].html';
		const result = chunksWebpackPlugin.getPathFromString();

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
		chunksWebpackPlugin.setError = jest.fn();
		mockIsValidCustomFormatTagsDatas(chunksWebpackPlugin, false);

		chunksWebpackPlugin.getHtmlTags({ chunks, Entrypoint });

		expect(chunksWebpackPlugin.isValidCustomFormatTagsDatas).toHaveBeenCalledWith(htmlTags);
		expect(chunksWebpackPlugin.setError).toHaveBeenCalledWith(
			'ChunksWebpackPlugin::customFormatTags return invalid object'
		);
	});
});

describe('ChunksWebpackPlugin sortsChunksByType', () => {
	it('Should call the sortsChunksByType function', () => {
		chunksWebpackPlugin.publicPath = compilationWebpack.options.output.publicPath;

		expect(chunksWebpackPlugin.sortsChunksByType(files)).toEqual({
			scripts: ['/dist/js/vendors~app-a~app-b~app-c.js', '/dist/js/app-a.js'],
			styles: ['/dist/css/vendors~app-a~app-b~app-c.css', '/dist/css/app-a.css']
		});
	});
});

describe('ChunksWebpackPlugin formatTags', () => {
	it('Should call the formatTags function', () => {
		expect(chunksWebpackPlugin.formatTags(chunks)).toEqual({
			styles: '<link rel="stylesheet" href="css/vendors~app-a~app-b~app-c.css" /><link rel="stylesheet" href="css/app-a.css" />',
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
			styles: '<link rel="stylesheet" href="https://cdn.domain.com/css/vendors~app-a~app-b~app-c.css" /><link rel="stylesheet" href="https://cdn.domain.com/css/app-a.css" />',
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

describe('ChunksWebpackPlugin isValidExtensionByType', () => {
	it('Should call the isValidExtensionByType function with a valid extension', () => {
		jest.spyOn(path, 'extname');

		const result = chunksWebpackPlugin.isValidExtensionByType(
			'css/vendors~app-a~app-b~app-c.css',
			'css'
		);

		expect(result).toBe(true);
		expect(path.extname).toHaveBeenCalledWith('css/vendors~app-a~app-b~app-c.css');
	});

	it('Should call the isValidExtensionByType function with an invalid extension', () => {
		jest.spyOn(path, 'extname');

		const result = chunksWebpackPlugin.isValidExtensionByType(
			'css/vendors~app-a~app-b~app-c.css.map',
			'css'
		);

		expect(result).toBe(false);
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

		expect(chunksWebpackPlugin.compilation.emitAsset).toHaveBeenCalledWith(
			'chunks-manifest.json',
			new RawSource(output, false)
		);
	});
});

describe('ChunksWebpackPlugin createHtmlChunksFiles', () => {
	it('Should call the createHtmlChunksFiles function', () => {
		chunksWebpackPlugin.createAsset = jest.fn();

		chunksWebpackPlugin.compilation = compilationWebpack;
		chunksWebpackPlugin.outputPath = '/dist/templates';

		chunksWebpackPlugin.createHtmlChunksFiles({
			entryName: 'app-a',
			htmlTags: {
				styles: '',
				scripts: ''
			}
		});

		expect(chunksWebpackPlugin.createAsset).not.toHaveBeenCalled();
	});

	it('Should call the createHtmlChunksFiles function with scripts and styles', () => {
		chunksWebpackPlugin.createAsset = jest.fn();

		chunksWebpackPlugin.compilation = compilationWebpack;
		chunksWebpackPlugin.outputPath = '/dist/templates';

		chunksWebpackPlugin.createHtmlChunksFiles({
			entryName: 'app-a',
			htmlTags
		});

		expect(chunksWebpackPlugin.createAsset).toHaveBeenCalledTimes(2);
		expect(chunksWebpackPlugin.createAsset).toHaveBeenNthCalledWith(1, {
			entryName: 'app-a',
			filename: 'templates/app-a-scripts.html',
			output: htmlTags.scripts
		});
		expect(chunksWebpackPlugin.createAsset).toHaveBeenNthCalledWith(2, {
			entryName: 'app-a',
			filename: 'templates/app-a-styles.html',
			output: htmlTags.styles
		});
	});
});

describe('ChunksWebpackPlugin createAsset', () => {
	it('Should call the createAsset function with the emitAsset', () => {
		chunksWebpackPlugin.compilation = compilationWebpack;
		chunksWebpackPlugin.getPathFromString = jest.fn();

		chunksWebpackPlugin.createAsset({
			filename: 'templates/app-a-scripts.html',
			output: htmlTags.scripts
		});

		expect(chunksWebpackPlugin.getPathFromString).not.toHaveBeenCalled();
		expect(chunksWebpackPlugin.compilation.emitAsset).toHaveBeenCalledWith(
			'templates/app-a-scripts.html',
			new RawSource(htmlTags.scripts, false)
		);
	});

	it('Should call the createAsset function with the Node.js FS and a custom entry name', () => {
		chunksWebpackPlugin.getOutputFilePath = jest
			.fn()
			.mockReturnValue(
				'/chunks-webpack-plugin/example/dist/templates/shared/app-a-scripts.html'
			);
		chunksWebpackPlugin.getPathFromString = jest.fn().mockReturnValue('shared/');

		chunksWebpackPlugin.compilation = compilationWebpack;
		chunksWebpackPlugin.outputPath = compilationWebpack.options.output.path;
		chunksWebpackPlugin.pathFromFilename = 'templates/';
		chunksWebpackPlugin.fs = compilationWebpack.compiler.outputFileSystem;
		chunksWebpackPlugin.options.outputPath = '/chunks-webpack-plugin/example/dist/templates';
		chunksWebpackPlugin.createAsset({
			entryName: 'shared/app-a',
			filename: 'templates/shared/app-a-scripts.html',
			output: htmlTags.scripts
		});

		expect(chunksWebpackPlugin.compilation.emitAsset).not.toHaveBeenCalled();
		expect(chunksWebpackPlugin.getPathFromString).toHaveBeenCalledWith('shared/app-a');
		expect(chunksWebpackPlugin.fs.mkdir).toHaveBeenCalledWith(
			'/chunks-webpack-plugin/example/dist/templates/shared/',
			{
				recursive: true
			},
			expect.any(Function)
		);
		expect(chunksWebpackPlugin.getOutputFilePath).toHaveBeenCalledWith(
			'templates/shared/app-a-scripts.html'
		);
		expect(chunksWebpackPlugin.fs.writeFile).toHaveBeenCalledWith(
			'/chunks-webpack-plugin/example/dist/templates/shared/app-a-scripts.html',
			htmlTags.scripts,
			expect.any(Function)
		);
	});

	it('Should call the createAsset function with the Node.js FS and mkdir error', () => {
		chunksWebpackPlugin.getOutputFilePath = jest.fn();

		chunksWebpackPlugin.compilation = compilationWebpack;
		chunksWebpackPlugin.outputPath = compilationWebpack.options.output.path;
		chunksWebpackPlugin.pathFromFilename = 'templates/';
		chunksWebpackPlugin.fs = generateMockFs({ mkdirError: true });
		chunksWebpackPlugin.options.outputPath = '/chunks-webpack-plugin/example/dist/templates';

		expect(() => {
			chunksWebpackPlugin.createAsset({
				filename: 'templates/app-a-scripts.html',
				output: htmlTags.scripts
			});
		}).toThrow(new Error('mkdir error'));
		expect(chunksWebpackPlugin.getOutputFilePath).not.toHaveBeenCalled();
	});

	it('Should call the createAsset function with the Node.js FS and writeFile error', () => {
		chunksWebpackPlugin.getOutputFilePath = jest.fn();

		chunksWebpackPlugin.compilation = compilationWebpack;
		chunksWebpackPlugin.outputPath = compilationWebpack.options.output.path;
		chunksWebpackPlugin.pathFromFilename = 'templates/';
		chunksWebpackPlugin.fs = generateMockFs({ writeFileError: true });
		chunksWebpackPlugin.options.outputPath = '/chunks-webpack-plugin/example/dist/templates';
		chunksWebpackPlugin.options.emitAssetsWithCompilation = false;

		expect(() => {
			chunksWebpackPlugin.createAsset({
				filename: 'templates/app-a-scripts.html',
				output: htmlTags.scripts
			});
		}).toThrow(new Error('writeFile error'));
		expect(chunksWebpackPlugin.getOutputFilePath).toHaveBeenCalled();
	});
});

describe('ChunksWebpackPlugin getOutputFilePath', () => {
	it('Should call the getOutputFilePath function', () => {
		chunksWebpackPlugin.outputPath = compilationWebpack.options.output.path;
		const result = chunksWebpackPlugin.getOutputFilePath('templates/app-a-scripts.html');

		expect(result).toBe('/chunks-webpack-plugin/example/dist/templates/app-a-scripts.html');
	});

	it('Should call the getOutputFilePath function with a filename that starts by a slashe', () => {
		chunksWebpackPlugin.outputPath = compilationWebpack.options.output.path;
		const result = chunksWebpackPlugin.getOutputFilePath('/templates/app-a-scripts.html');

		expect(result).toBe('/chunks-webpack-plugin/example/dist/templates/app-a-scripts.html');
	});
});

describe('ChunksWebpackPlugin setError', () => {
	it('Should call the setError function', () => {
		expect(() => {
			chunksWebpackPlugin.setError('message');
		}).toThrow(new Error('message'));
	});
});
