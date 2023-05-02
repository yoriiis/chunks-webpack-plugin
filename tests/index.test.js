import ChunksWebpackPlugin from '@src/index';
import path from 'path';
import { validate } from 'schema-utils';
import schemaOptions from '@src/schemas/plugin-options.json';

jest.mock('schema-utils');
jest.mock('webpack', () => ({
	Compilation: {
		PROCESS_ASSETS_STAGE_ADDITIONAL: ''
	},
	sources: {
		RawSource: jest.fn()
	}
}));

let chunksWebpackPlugin;
let compilationWebpack;

const options = {
	filename: 'templates/[name]-[type].html',
	generateChunksManifest: true,
	generateChunksFiles: true,
	templateStyle: (name) => `<link rel="stylesheet" href="https://cdn.domain.com/${name}" />`,
	templateScript: (name) => `<script defer src="https://cdn.domain.com/${name}"></script>`
};

const getInstance = () => new ChunksWebpackPlugin(options);

beforeEach(() => {
	compilationWebpack = {
		options: {
			context: '/chunks-webpack-plugin/example',
			output: {
				path: '/chunks-webpack-plugin/example/dist',
				publicPath: '/dist/'
			}
		},
		entrypoints: {
			get: jest.fn(),
			keys: jest.fn()
		},
		compiler: {
			webpack: {
				sources: {
					RawSource: jest.fn()
				}
			}
		},
		getCache: jest.fn(),
		getAsset: jest.fn(),
		emitAsset: jest.fn(),
		hooks: {
			processAssets: {
				tapPromise: jest.fn()
			}
		}
	};

	chunksWebpackPlugin = getInstance();
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('ChunksWebpackPlugin', () => {
	describe('ChunksWebpackPlugin constructor', () => {
		it('Should initialize the constructor with custom options', () => {
			expect(chunksWebpackPlugin.options).toStrictEqual({
				filename: 'templates/[name]-[type].html',
				templateStyle: expect.any(Function),
				templateScript: expect.any(Function),
				generateChunksManifest: true,
				generateChunksFiles: true
			});
			expect(validate).toHaveBeenCalledWith(schemaOptions, chunksWebpackPlugin.options, {
				name: 'ChunksWebpackPlugin',
				baseDataPath: 'options'
			});
			expect(chunksWebpackPlugin.options.templateStyle('app.css')).toStrictEqual(
				'<link rel="stylesheet" href="https://cdn.domain.com/app.css" />'
			);
			expect(chunksWebpackPlugin.options.templateScript('app.js')).toStrictEqual(
				'<script defer src="https://cdn.domain.com/app.js"></script>'
			);
		});

		it('Should initialize the constructor with default options', () => {
			const instance = new ChunksWebpackPlugin();

			expect(instance.options).toStrictEqual({
				filename: '[name]-[type].html',
				templateStyle: expect.any(Function),
				templateScript: expect.any(Function),
				generateChunksManifest: false,
				generateChunksFiles: true
			});
			expect(instance.options.templateStyle('app.css')).toStrictEqual(
				'<link rel="stylesheet" href="app.css" />'
			);
			expect(instance.options.templateScript('app.js')).toStrictEqual(
				'<script defer src="app.js"></script>'
			);
		});
	});

	describe('ChunksWebpackPlugin apply', () => {
		it('Should call the apply function', () => {
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

			chunksWebpackPlugin.apply(compilerWebpack);

			expect(compilerWebpack.hooks.thisCompilation.tap).toHaveBeenCalled();
		});
	});

	describe('ChunksWebpackPlugin hookCallback', () => {
		it('Should call the hookCallback function', () => {
			chunksWebpackPlugin.addAssets.bind = jest.fn();

			chunksWebpackPlugin.hookCallback(compilationWebpack);

			expect(compilationWebpack.hooks.processAssets.tapPromise).toHaveBeenCalledWith(
				{
					name: 'ChunksWebpackPlugin',
					stage: ''
				},
				chunksWebpackPlugin.addAssets.bind(chunksWebpackPlugin, compilationWebpack)
			);
		});
	});

	describe('ChunksWebpackPlugin addAssets', () => {
		it('Should call the addAssets function with no dependencies', async () => {
			chunksWebpackPlugin.getFilesDependenciesByEntrypoint = jest
				.fn()
				.mockReturnValue({ css: [], js: [] });
			chunksWebpackPlugin.getPublicPath = jest.fn().mockReturnValue('');

			chunksWebpackPlugin.getAssetData = jest.fn();
			chunksWebpackPlugin.createChunksManifestFile = jest.fn();

			compilationWebpack.entrypoints.keys.mockReturnValue(['home']);
			compilationWebpack.getCache.mockReturnValue({
				getLazyHashedEtag: jest.fn(),
				mergeEtags: jest.fn(),
				getItemCache: jest.fn()
			});

			await chunksWebpackPlugin.addAssets(compilationWebpack);

			expect(chunksWebpackPlugin.getFilesDependenciesByEntrypoint).toHaveBeenCalledWith({
				compilation: compilationWebpack,
				entryName: 'home'
			});
			expect(chunksWebpackPlugin.getPublicPath).toHaveBeenCalledWith(compilationWebpack);
			expect(compilationWebpack.getCache().getLazyHashedEtag).not.toHaveBeenCalled();
			expect(compilationWebpack.getCache().mergeEtags).not.toHaveBeenCalled();
			expect(compilationWebpack.getCache().getItemCache).not.toHaveBeenCalled();
			expect(chunksWebpackPlugin.createChunksManifestFile).not.toHaveBeenCalled();
		});

		it('Should call the addAssets function with dependencies and without cache', async () => {
			chunksWebpackPlugin.getFilesDependenciesByEntrypoint = jest.fn().mockReturnValue({
				css: [
					{ name: 'a.css', source: 'module css a' },
					{ name: 'b.css', source: 'module css b' },
					{ name: 'c.css', source: 'module css c' }
				],
				js: [
					{ name: 'a.js', source: 'module js a' },
					{ name: 'b.js', source: 'module js b' },
					{ name: 'c.js', source: 'module js c' }
				]
			});
			chunksWebpackPlugin.getPublicPath = jest.fn().mockReturnValue('dist/');
			chunksWebpackPlugin.getAssetData = jest
				.fn()
				.mockReturnValueOnce({
					filePath: ['dist/abc.css', 'dist/def.css'],
					htmlTags:
						'<link rel="stylesheet" href="https://cdn.domain.com/dist/abc.css" /><link rel="stylesheet" href="https://cdn.domain.com/dist/def.css" />'
				})
				.mockReturnValueOnce({
					filePath: ['dist/abc.js', 'dist/def.js'],
					htmlTags:
						'<script defer src="https://cdn.domain.com/dist/abc.js"></script><script defer src="https://cdn.domain.com/dist/def.js"></script>'
				});
			chunksWebpackPlugin.createChunksManifestFile = jest.fn();
			compilationWebpack.compiler.webpack.sources.RawSource.mockReturnValueOnce({
				source: '<link rel="stylesheet" href="https://cdn.domain.com/dist/abc.css" /><link rel="stylesheet" href="https://cdn.domain.com/dist/def.css" />'
			}).mockReturnValueOnce({
				source: '<script defer src="https://cdn.domain.com/dist/abc.js"></script><script defer src="https://cdn.domain.com/dist/def.js"></script>'
			});

			compilationWebpack.entrypoints.keys.mockReturnValue(['home']);
			compilationWebpack.getCache.mockReturnValue({
				getLazyHashedEtag: jest
					.fn()
					.mockReturnValueOnce('module css a')
					.mockReturnValueOnce('module css b')
					.mockReturnValueOnce('module css c')
					.mockReturnValueOnce('module js a')
					.mockReturnValueOnce('module js b')
					.mockReturnValueOnce('module js c')
					.mockReturnValueOnce('css home')
					.mockReturnValueOnce('js home'),
				mergeEtags: jest
					.fn()
					.mockReturnValueOnce('123456789123')
					.mockReturnValueOnce('123456789123')
					.mockReturnValueOnce('abcdefghijkl')
					.mockReturnValueOnce('abcdefghijkl')
					.mockReturnValueOnce('12345abcdefg'),
				getItemCache: jest.fn().mockReturnValue({
					getPromise: jest.fn(),
					storePromise: jest.fn()
				})
			});

			await chunksWebpackPlugin.addAssets(compilationWebpack);

			expect(chunksWebpackPlugin.getFilesDependenciesByEntrypoint).toHaveBeenCalledWith({
				compilation: compilationWebpack,
				entryName: 'home'
			});
			expect(chunksWebpackPlugin.getPublicPath).toHaveBeenCalledWith(compilationWebpack);

			// CSS
			expect(compilationWebpack.getCache().getLazyHashedEtag).toHaveBeenNthCalledWith(
				1,
				'module css a'
			);
			expect(compilationWebpack.getCache().getLazyHashedEtag).toHaveBeenNthCalledWith(
				2,
				'module css b'
			);
			expect(compilationWebpack.getCache().getLazyHashedEtag).toHaveBeenNthCalledWith(
				3,
				'module css c'
			);
			expect(compilationWebpack.getCache().getItemCache).toHaveBeenNthCalledWith(
				1,
				'css|home',
				'123456789123'
			);
			expect(compilationWebpack.getCache().getItemCache().getPromise).toHaveBeenNthCalledWith(
				1
			);
			expect(chunksWebpackPlugin.getAssetData).toHaveBeenNthCalledWith(1, {
				templateFunction: chunksWebpackPlugin.options.templateStyle,
				assets: [
					{
						name: 'a.css',
						source: 'module css a'
					},
					{
						name: 'b.css',
						source: 'module css b'
					},
					{
						name: 'c.css',
						source: 'module css c'
					}
				],
				entryName: 'home',
				publicPath: 'dist/'
			});
			expect(
				compilationWebpack.getCache().getItemCache().storePromise
			).toHaveBeenNthCalledWith(1, {
				source: {
					source: '<link rel="stylesheet" href="https://cdn.domain.com/dist/abc.css" /><link rel="stylesheet" href="https://cdn.domain.com/dist/def.css" />'
				},
				filePath: ['dist/abc.css', 'dist/def.css'],
				htmlTags:
					'<link rel="stylesheet" href="https://cdn.domain.com/dist/abc.css" /><link rel="stylesheet" href="https://cdn.domain.com/dist/def.css" />',
				filename: 'templates/home-styles.html'
			});

			// JS
			expect(compilationWebpack.getCache().getLazyHashedEtag).toHaveBeenNthCalledWith(
				4,
				'module js a'
			);
			expect(compilationWebpack.getCache().getLazyHashedEtag).toHaveBeenNthCalledWith(
				5,
				'module js b'
			);
			expect(compilationWebpack.getCache().getLazyHashedEtag).toHaveBeenNthCalledWith(
				6,
				'module js c'
			);
			expect(compilationWebpack.getCache().getItemCache).toHaveBeenNthCalledWith(
				2,
				'js|home',
				'abcdefghijkl'
			);
			expect(compilationWebpack.getCache().getItemCache().getPromise).toHaveBeenNthCalledWith(
				2
			);
			expect(chunksWebpackPlugin.getAssetData).toHaveBeenNthCalledWith(2, {
				templateFunction: chunksWebpackPlugin.options.templateScript,
				assets: [
					{
						name: 'a.js',
						source: 'module js a'
					},
					{
						name: 'b.js',
						source: 'module js b'
					},
					{
						name: 'c.js',
						source: 'module js c'
					}
				],
				entryName: 'home',
				publicPath: 'dist/'
			});
			expect(
				compilationWebpack.getCache().getItemCache().storePromise
			).toHaveBeenNthCalledWith(2, {
				source: {
					source: '<script defer src="https://cdn.domain.com/dist/abc.js"></script><script defer src="https://cdn.domain.com/dist/def.js"></script>'
				},
				filePath: ['dist/abc.js', 'dist/def.js'],
				htmlTags:
					'<script defer src="https://cdn.domain.com/dist/abc.js"></script><script defer src="https://cdn.domain.com/dist/def.js"></script>',
				filename: 'templates/home-scripts.html'
			});

			expect(compilationWebpack.getCache().getLazyHashedEtag).toHaveBeenNthCalledWith(7, {
				source: '<link rel="stylesheet" href="https://cdn.domain.com/dist/abc.css" /><link rel="stylesheet" href="https://cdn.domain.com/dist/def.css" />'
			});
			expect(compilationWebpack.getCache().getLazyHashedEtag).toHaveBeenNthCalledWith(8, {
				source: '<script defer src="https://cdn.domain.com/dist/abc.js"></script><script defer src="https://cdn.domain.com/dist/def.js"></script>'
			});
			expect(compilationWebpack.getCache().getLazyHashedEtag).toHaveBeenCalledTimes(8);
			expect(compilationWebpack.getCache().mergeEtags).toHaveBeenCalledTimes(5);
			expect(chunksWebpackPlugin.createChunksManifestFile).toHaveBeenCalledWith({
				compilation: compilationWebpack,
				cache: {
					getLazyHashedEtag: expect.any(Function),
					mergeEtags: expect.any(Function),
					getItemCache: expect.any(Function)
				},
				eTag: '12345abcdefg',
				manifest: {
					home: {
						scripts: ['dist/abc.js', 'dist/def.js'],
						styles: ['dist/abc.css', 'dist/def.css']
					}
				}
			});
		});

		it('Should call the addAssets function with dependencies and without cache with CSS only', async () => {
			chunksWebpackPlugin.getFilesDependenciesByEntrypoint = jest.fn().mockReturnValue({
				css: [
					{ name: 'a.css', source: 'module css a' },
					{ name: 'b.css', source: 'module css b' },
					{ name: 'c.css', source: 'module css c' }
				],
				js: []
			});
			chunksWebpackPlugin.getPublicPath = jest.fn().mockReturnValue('dist/');
			chunksWebpackPlugin.getAssetData = jest
				.fn()
				.mockReturnValueOnce({
					filePath: ['dist/abc.css', 'dist/def.css'],
					htmlTags:
						'<link rel="stylesheet" href="https://cdn.domain.com/dist/abc.css" /><link rel="stylesheet" href="https://cdn.domain.com/dist/def.css" />'
				})
				.mockReturnValueOnce({
					filePath: [],
					htmlTags: ''
				});
			chunksWebpackPlugin.createChunksManifestFile = jest.fn();
			compilationWebpack.compiler.webpack.sources.RawSource.mockReturnValueOnce({
				source: '<link rel="stylesheet" href="https://cdn.domain.com/dist/abc.css" /><link rel="stylesheet" href="https://cdn.domain.com/dist/def.css" />'
			});

			compilationWebpack.entrypoints.keys.mockReturnValue(['home']);
			compilationWebpack.getCache.mockReturnValue({
				getLazyHashedEtag: jest
					.fn()
					.mockReturnValueOnce('module css a')
					.mockReturnValueOnce('module css b')
					.mockReturnValueOnce('module css c')
					.mockReturnValueOnce('css home'),
				mergeEtags: jest
					.fn()
					.mockReturnValueOnce('123456789123')
					.mockReturnValueOnce('123456789123'),
				getItemCache: jest.fn().mockReturnValue({
					getPromise: jest.fn(),
					storePromise: jest.fn()
				})
			});

			await chunksWebpackPlugin.addAssets(compilationWebpack);

			expect(chunksWebpackPlugin.getFilesDependenciesByEntrypoint).toHaveBeenCalledWith({
				compilation: compilationWebpack,
				entryName: 'home'
			});
			expect(chunksWebpackPlugin.getPublicPath).toHaveBeenCalledWith(compilationWebpack);

			// CSS
			expect(compilationWebpack.getCache().getLazyHashedEtag).toHaveBeenNthCalledWith(
				1,
				'module css a'
			);
			expect(compilationWebpack.getCache().getLazyHashedEtag).toHaveBeenNthCalledWith(
				2,
				'module css b'
			);
			expect(compilationWebpack.getCache().getLazyHashedEtag).toHaveBeenNthCalledWith(
				3,
				'module css c'
			);
			expect(compilationWebpack.getCache().getItemCache).toHaveBeenNthCalledWith(
				1,
				'css|home',
				'123456789123'
			);
			expect(compilationWebpack.getCache().getItemCache().getPromise).toHaveBeenNthCalledWith(
				1
			);
			expect(chunksWebpackPlugin.getAssetData).toHaveBeenNthCalledWith(1, {
				templateFunction: chunksWebpackPlugin.options.templateStyle,
				assets: [
					{
						name: 'a.css',
						source: 'module css a'
					},
					{
						name: 'b.css',
						source: 'module css b'
					},
					{
						name: 'c.css',
						source: 'module css c'
					}
				],
				entryName: 'home',
				publicPath: 'dist/'
			});
			expect(
				compilationWebpack.getCache().getItemCache().storePromise
			).toHaveBeenNthCalledWith(1, {
				source: {
					source: '<link rel="stylesheet" href="https://cdn.domain.com/dist/abc.css" /><link rel="stylesheet" href="https://cdn.domain.com/dist/def.css" />'
				},
				filePath: ['dist/abc.css', 'dist/def.css'],
				htmlTags:
					'<link rel="stylesheet" href="https://cdn.domain.com/dist/abc.css" /><link rel="stylesheet" href="https://cdn.domain.com/dist/def.css" />',
				filename: 'templates/home-styles.html'
			});

			expect(compilationWebpack.getCache().getLazyHashedEtag).toHaveBeenNthCalledWith(4, {
				source: '<link rel="stylesheet" href="https://cdn.domain.com/dist/abc.css" /><link rel="stylesheet" href="https://cdn.domain.com/dist/def.css" />'
			});
			expect(compilationWebpack.getCache().getLazyHashedEtag).toHaveBeenCalledTimes(4);
			expect(compilationWebpack.getCache().mergeEtags).toHaveBeenCalledTimes(2);
			expect(chunksWebpackPlugin.createChunksManifestFile).toHaveBeenCalledWith({
				compilation: compilationWebpack,
				cache: {
					getLazyHashedEtag: expect.any(Function),
					mergeEtags: expect.any(Function),
					getItemCache: expect.any(Function)
				},
				eTag: 'css home', // Because reduce is not executed when array contains only one item
				manifest: {
					home: {
						scripts: [],
						styles: ['dist/abc.css', 'dist/def.css']
					}
				}
			});
		});
	});

	describe('ChunksWebpackPlugin getFilesDependenciesByEntrypoint', () => {
		it('Should call the getFilesDependenciesByEntrypoint function', () => {
			compilationWebpack.entrypoints.get.mockReturnValue({
				getFiles: jest
					.fn()
					.mockReturnValue(['a.css', 'a.js', 'b.css', 'b.js', 'a.jpg', 'a.svg', 'a.json'])
			});
			compilationWebpack.getAsset
				.mockReturnValueOnce('a.css')
				.mockReturnValueOnce('a.js')
				.mockReturnValueOnce('b.css')
				.mockReturnValueOnce('b.js');

			const result = chunksWebpackPlugin.getFilesDependenciesByEntrypoint({
				compilation: compilationWebpack,
				entryName: 'home'
			});

			expect(result).toStrictEqual({ css: ['a.css', 'b.css'], js: ['a.js', 'b.js'] });
		});

		it('Should call the getFilesDependenciesByEntrypoint function with entries null', () => {
			compilationWebpack.entrypoints = null;

			const result = chunksWebpackPlugin.getFilesDependenciesByEntrypoint({
				compilation: compilationWebpack,
				entryName: 'home'
			});

			expect(result).toStrictEqual({ css: [], js: [] });
		});

		it('Should call the getFilesDependenciesByEntrypoint function with entries size 0', () => {
			compilationWebpack.entrypoints.size = 0;

			const result = chunksWebpackPlugin.getFilesDependenciesByEntrypoint({
				compilation: compilationWebpack,
				entryName: 'home'
			});

			expect(compilationWebpack.entrypoints.get).not.toHaveBeenCalled();
			expect(result).toStrictEqual({ css: [], js: [] });
		});

		it('Should call the getFilesDependenciesByEntrypoint function with entries empty', () => {
			const result = chunksWebpackPlugin.getFilesDependenciesByEntrypoint({
				compilation: compilationWebpack,
				entryName: 'home'
			});

			expect(result).toStrictEqual({ css: [], js: [] });
			expect(compilationWebpack.entrypoints.get).toHaveBeenCalledWith('home');
		});
	});

	describe('ChunksWebpackPlugin getPublicPath', () => {
		it('Should call the getPublicPath function with a string', () => {
			expect(chunksWebpackPlugin.getPublicPath(compilationWebpack)).toBe('/dist/');
		});

		it('Should call the getPublicPath function with the default value "auto"', () => {
			compilationWebpack.options.output.publicPath = 'auto';

			expect(chunksWebpackPlugin.getPublicPath(compilationWebpack)).toBe('/dist');
		});

		it('Should call the getPublicPath function with context empty', () => {
			jest.spyOn(path, 'relative').mockImplementation((_from, to) =>
				to.replace('/chunks-webpack-plugin/example/', '')
			);

			compilationWebpack.options.output.publicPath = 'auto';
			compilationWebpack.options.context = undefined;

			expect(chunksWebpackPlugin.getPublicPath(compilationWebpack)).toBe('/dist');
		});

		it('Should call the getPublicPath function with output.path empty', () => {
			jest.spyOn(path, 'relative').mockImplementation((_from, to) =>
				to.replace('/chunks-webpack-plugin/example/', '')
			);

			compilationWebpack.options.output.publicPath = 'auto';
			compilationWebpack.options.output.path = undefined;

			expect(chunksWebpackPlugin.getPublicPath(compilationWebpack)).toBe('/');
		});

		it('Should call the getPublicPath function with an undefined value', () => {
			compilationWebpack.options.output.publicPath = undefined;

			expect(chunksWebpackPlugin.getPublicPath(compilationWebpack)).toBe('');
		});

		it('Should call the getPublicPath function with a function', () => {
			compilationWebpack.options.output.publicPath = () => '/dist/';

			expect(chunksWebpackPlugin.getPublicPath(compilationWebpack)).toBe('/dist/');
		});
	});

	describe('ChunksWebpackPlugin getAssetData', () => {
		it('Should call the getAssetData function with context', () => {
			const response = chunksWebpackPlugin.getAssetData({
				templateFunction: chunksWebpackPlugin.options.templateStyle,
				assets: [
					{
						name: 'abc'
					},
					{
						name: 'def'
					}
				],
				entryName: 'app-a',
				publicPath: 'dist/'
			});

			expect(response).toStrictEqual({
				filePath: ['dist/abc', 'dist/def'],
				htmlTags:
					'<link rel="stylesheet" href="https://cdn.domain.com/dist/abc" /><link rel="stylesheet" href="https://cdn.domain.com/dist/def" />'
			});
		});
	});

	describe('ChunksWebpackPlugin createChunksManifestFile', () => {
		let cache;
		const manifest = {
			home: {
				styles: ['a.css', 'b.css'],
				scripts: ['a.js', 'b.js']
			}
		};

		beforeEach(() => {
			cache = {
				getLazyHashedEtag: jest.fn(),
				mergeEtags: jest.fn(),
				getItemCache: jest.fn().mockReturnValue({
					getPromise: jest.fn(),
					storePromise: jest.fn()
				})
			};
		});

		afterEach(() => {
			expect(cache.getItemCache).toHaveBeenCalledWith('chunks-manifest.json', 'a1b2c3d4e5f6');
			expect(cache.getItemCache().getPromise).toHaveBeenCalled();
		});

		it('Should call the createChunksManifestFile function without cache', async () => {
			compilationWebpack.compiler.webpack.sources.RawSource.mockReturnValue({
				source: manifest
			});

			await chunksWebpackPlugin.createChunksManifestFile({
				compilation: compilationWebpack,
				cache,
				eTag: 'a1b2c3d4e5f6',
				manifest
			});

			expect(compilationWebpack.compiler.webpack.sources.RawSource).toHaveBeenCalledWith(
				JSON.stringify(manifest, null, 2),
				false
			);
			expect(cache.getItemCache().storePromise).toHaveBeenCalledWith({
				source: manifest
			});
			expect(compilationWebpack.emitAsset).toHaveBeenCalledWith('chunks-manifest.json', {
				source: manifest
			});
		});

		it('Should call the createChunksManifestFile function with cache', async () => {
			cache.getItemCache().getPromise.mockReturnValue({
				source: manifest
			});

			await chunksWebpackPlugin.createChunksManifestFile({
				compilation: compilationWebpack,
				cache,
				eTag: 'a1b2c3d4e5f6',
				manifest
			});

			expect(compilationWebpack.compiler.webpack.sources.RawSource).not.toHaveBeenCalled();
			expect(cache.getItemCache().storePromise).not.toHaveBeenCalled();
			expect(compilationWebpack.emitAsset).toHaveBeenCalledWith('chunks-manifest.json', {
				source: manifest
			});
		});
	});
});
