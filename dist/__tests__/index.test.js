'use strict';

var _index = _interopRequireDefault(require("../index"));

var _utils = _interopRequireDefault(require("../utils"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const getInstance = () => new _index.default({
  outputPath: '/dist/templates',
  fileExtension: '.html',
  generateChunksManifest: true,
  generateChunksFiles: true,
  customFormatTags: (chunksSorted, chunkGroup) => {
    // Generate all HTML style tags with CDN prefix
    const styles = chunksSorted['styles'].map(chunkCss => `<link rel="stylesheet" href="https://cdn.domain.com${chunkCss}" />`).join(''); // Generate all HTML style tags with CDN prefix and defer attribute

    const scripts = chunksSorted['scripts'].map(chunkJs => `<script defer src="https://cdn.domain.com${chunkJs}"></script>`).join('');
    return {
      styles,
      scripts
    };
  }
});

let chunksWebpackPlugin;
let compilationWebpack;
beforeEach(() => {
  compilationWebpack = {
    assets: {},
    chunkGroups: [{
      chunks: [{
        files: ['css/vendors~app-a~app-b.css', 'js/vendors~app-a~app-b.js']
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
  };
  chunksWebpackPlugin = getInstance();
});
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
    });
  });
  it('should init the hookEmit function', () => {
    chunksWebpackPlugin.createHtmlChunksFiles = jest.fn();
    chunksWebpackPlugin.hookEmit(compilationWebpack);
    expect(chunksWebpackPlugin.createHtmlChunksFiles).toHaveBeenCalled();
  });
  it('should init the updateManifest function', () => {
    const publicPath = chunksWebpackPlugin.getPublicPath(compilationWebpack);
    compilationWebpack.chunkGroups.forEach(chunkGroup => {
      let chunksSorted = chunksWebpackPlugin.sortsChunksByType({
        chunks: chunkGroup.chunks,
        publicPath: publicPath
      });
      chunksWebpackPlugin.updateManifest({
        entryName: chunkGroup.options.name,
        chunks: chunksSorted
      });
      expect(chunksWebpackPlugin.manifest).toMatchObject({
        'app-a': {
          styles: ['/dist/css/vendors~app-a~app-b.css'],
          scripts: ['/dist/js/vendors~app-a~app-b.js']
        }
      });
    });
  });
  it('should init the getPublicPath function', () => {
    const publicPath = chunksWebpackPlugin.getPublicPath(compilationWebpack);
    expect(publicPath).toBe('/dist/');
  });
  it('should init the getOutputPath function', () => {
    const outputPath = chunksWebpackPlugin.getOutputPath(compilationWebpack);
    expect(outputPath).toBe('/dist/templates');
  });
  it('should init the sortsChunksByType function', () => {
    const publicPath = chunksWebpackPlugin.getPublicPath(compilationWebpack);
    compilationWebpack.chunkGroups.forEach(chunkGroup => {
      let chunksSorted = chunksWebpackPlugin.sortsChunksByType({
        chunks: chunkGroup.chunks,
        publicPath: publicPath
      });
      expect(chunksSorted).toMatchObject({
        styles: ['/dist/css/vendors~app-a~app-b.css'],
        scripts: ['/dist/js/vendors~app-a~app-b.js']
      });
    });
  });
  it('should init the generateTags function', () => {
    const publicPath = chunksWebpackPlugin.getPublicPath(compilationWebpack);
    compilationWebpack.chunkGroups.forEach(chunkGroup => {
      let chunksSorted = chunksWebpackPlugin.sortsChunksByType({
        chunks: chunkGroup.chunks,
        publicPath: publicPath
      });
      const tags = chunksWebpackPlugin.generateTags(chunksSorted);
      expect(tags).toMatchObject({
        styles: '<link rel="stylesheet" href="/dist/css/vendors~app-a~app-b.css" />',
        scripts: '<script src="/dist/js/vendors~app-a~app-b.js"></script>'
      });
    });
  });
  it('should init the createHtmlChunksFiles function', () => {
    _utils.default.writeFile = jest.fn();
    chunksWebpackPlugin.createHtmlChunksFiles({
      entry: 'app-a',
      tagsHTML: {
        styles: '<link rel="stylesheet" href="/dist/css/vendors~app-a~app-b.css" />',
        scripts: '<script src="/dist/js/vendors~app-a~app-b.js"></script>'
      },
      outputPath: '/dist/'
    });
    expect(_utils.default.writeFile).toHaveBeenCalled();
  });
  it('should init the createChunksManifestFile function', () => {
    const publicPath = chunksWebpackPlugin.getPublicPath(compilationWebpack);
    compilationWebpack.chunkGroups.forEach(chunkGroup => {
      let chunksSorted = chunksWebpackPlugin.sortsChunksByType({
        chunks: chunkGroup.chunks,
        publicPath: publicPath
      });
      chunksWebpackPlugin.updateManifest({
        entryName: chunkGroup.options.name,
        chunks: chunksSorted
      });
    });
    const outputPath = chunksWebpackPlugin.getOutputPath(compilationWebpack);
    chunksWebpackPlugin.createChunksManifestFile({
      compilation: compilationWebpack,
      outputPath: outputPath
    });
    expect(Object.keys(compilationWebpack.assets)).toEqual(['chunks-manifest.json']);
    expect(Object.keys(compilationWebpack.assets['chunks-manifest.json'])).toEqual(['source', 'size']);
    const source = compilationWebpack.assets['chunks-manifest.json'].source();
    expect(source).toEqual(JSON.stringify({
      'app-a': {
        styles: ['/dist/css/vendors~app-a~app-b.css'],
        scripts: ['/dist/js/vendors~app-a~app-b.js']
      }
    }, null, 2));
    const size = compilationWebpack.assets['chunks-manifest.json'].size();
    expect(size).toEqual(148);
  });
});