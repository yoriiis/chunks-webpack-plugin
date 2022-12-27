"use strict";
/**
 * @license MIT
 * @name ChunksWebpackPlugin
 * @version 7.1.0
 * @author: Yoriiis aka Joris DANIEL <joris.daniel@gmail.com>
 * @description: ChunksWebpackPlugin create HTML files to serve your webpack bundles. It is very convenient with multiple entrypoints and it works without configuration.
 * {@link https://github.com/yoriiis/chunks-webpack-plugins}
 * @copyright 2023 Joris DANIEL
 **/
var path = require("path");
var webpack = require('webpack');
var RawSource = webpack.sources.RawSource;
module.exports = /** @class */ (function () {
    /**
     * Instanciate the constructor
     * @param {options}
     */
    function ChunksWebpackPlugin(options) {
        if (options === void 0) { options = {}; }
        // Merge default options with user options
        this.options = Object.assign({
            filename: '[name]-[type].html',
            templateStyle: '<link rel="stylesheet" href="{{chunk}}" />',
            templateScript: '<script src="{{chunk}}"></script>',
            outputPath: null,
            customFormatTags: false,
            generateChunksManifest: false,
            generateChunksFiles: true
        }, options);
        this.manifest = {};
        this.addAssets = this.addAssets.bind(this);
    }
    /**
     * Apply function is automatically called by the Webpack main compiler
     * @param {Object} compiler The Webpack compiler variable
     */
    ChunksWebpackPlugin.prototype.apply = function (compiler) {
        compiler.hooks.thisCompilation.tap('ChunksWebpackPlugin', this.hookCallback.bind(this));
    };
    /**
     * Hook expose by the Webpack compiler
     * @param {Object} compilation The Webpack compilation variable
     */
    ChunksWebpackPlugin.prototype.hookCallback = function (compilation) {
        this.compilation = compilation;
        this.fs = this.compilation.compiler.outputFileSystem;
        var stage = this.options.outputPath
            ? Infinity
            : webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL;
        this.compilation.hooks.processAssets.tap({
            name: 'ChunksWebpackPlugin',
            stage: stage
        }, this.addAssets);
    };
    /**
     * Add assets
     * The hook is triggered by webpack
     */
    ChunksWebpackPlugin.prototype.addAssets = function () {
        var _this = this;
        this.publicPath = this.getPublicPath();
        this.outputPath = this.getOutputPath();
        this.pathFromFilename = this.getPathFromString(this.options.filename);
        this.entryNames = this.getEntryNames();
        this.entryNames
            .filter(function (entryName) { return _this.getFiles(entryName).length; })
            .map(function (entryName) { return _this.processEntry(entryName); });
        // Check if manifest option is enabled
        if (this.options.generateChunksManifest) {
            this.createChunksManifestFile();
        }
    };
    /**
     * Process for each entry
     * @param {String} entryName Entrypoint name
     */
    ChunksWebpackPlugin.prototype.processEntry = function (entryName) {
        var files = this.getFiles(entryName);
        var chunks = this.sortsChunksByType(files);
        var Entrypoint = this.compilation.entrypoints.get(entryName);
        var htmlTags = this.getHtmlTags({ chunks: chunks, Entrypoint: Entrypoint });
        // Check if HTML chunk files option is enabled and htmlTags valid
        if (this.options.generateChunksFiles && htmlTags) {
            this.createHtmlChunksFiles({ entryName: entryName, htmlTags: htmlTags });
        }
        // Check if manifest option is enabled
        if (this.options.generateChunksManifest) {
            this.updateManifest({ entryName: entryName, chunks: chunks });
        }
    };
    /**
     * Get the public path from Webpack configuation
     * and add slash at the end if necessary
     * @return {String} The public path
     */
    ChunksWebpackPlugin.prototype.getPublicPath = function () {
        var publicPath = this.compilation.options.output.publicPath || '';
        // Default value for the publicPath is "auto"
        // The value must be generated automatically from the webpack compilation data
        if (publicPath === 'auto') {
            publicPath = "/".concat(path.relative(this.compilation.options.context, this.compilation.options.output.path));
        }
        else if (typeof publicPath === 'function') {
            publicPath = publicPath();
        }
        return "".concat(publicPath).concat(this.isPublicPathNeedsEndingSlash(publicPath) ? '/' : '');
    };
    /**
     * Get the output path from Webpack configuation
     * or from constructor options
     * @return {String} The output path
     */
    ChunksWebpackPlugin.prototype.getOutputPath = function () {
        return this.isValidOutputPath()
            ? this.options.outputPath
            : this.compilation.options.output.path || '';
    };
    /**
     * Get the path inside a string if it exists
     * Filename can contain a directory
     * @returns {String} The outpath path extract from the filename
     */
    ChunksWebpackPlugin.prototype.getPathFromString = function (filename) {
        var path = /(^\/?)(.*\/)(.*)$/.exec(filename);
        return path && path[2] !== '/' ? path[2] : '';
    };
    /**
     * Check if the outputPath is valid, a string and absolute
     * @returns {Boolean} outputPath is valid
     */
    ChunksWebpackPlugin.prototype.isValidOutputPath = function () {
        return !!(this.options.outputPath && path.isAbsolute(this.options.outputPath));
    };
    /**
     * Get entrypoint names from the compilation
     * @return {Array} List of entrypoint names
     */
    ChunksWebpackPlugin.prototype.getEntryNames = function () {
        return Array.from(this.compilation.entrypoints.keys());
    };
    /**
     * Get files list by entrypoint name
     *
     * @param {String} entryName Entrypoint name
     * @return {Array} List of entrypoint names
     */
    ChunksWebpackPlugin.prototype.getFiles = function (entryName) {
        return this.compilation.entrypoints.get(entryName).getFiles();
    };
    /**
     * Get HTML tags from chunks
     * @param {Object} options
     * @param {Object} options.chunks Chunks sorted by type (style, script)
     * @param {Object} options.Entrypoint Entrypoint object part of a single ChunkGroup
     * @returns {String} HTML tags by entrypoints
     */
    ChunksWebpackPlugin.prototype.getHtmlTags = function (_a) {
        var chunks = _a.chunks, Entrypoint = _a.Entrypoint;
        // The user prefers to generate his own HTML tags, use his object
        if (typeof this.options.customFormatTags === 'function') {
            var htmlTags = this.options.customFormatTags(chunks, Entrypoint);
            // Check if datas are correctly formatted
            if (this.isValidCustomFormatTagsDatas(htmlTags)) {
                return htmlTags;
            }
            else {
                this.setError('ChunksWebpackPlugin::customFormatTags return invalid object');
            }
        }
        else {
            // Default behavior, generate HTML tags with templateStyle and templateScript options
            return this.formatTags(chunks);
        }
    };
    /**
     * Sorts all chunks by type (styles or scripts)
     * @param {Array} files List of files by entrypoint name
     * @returns {Object} All chunks sorted by extension type
     */
    ChunksWebpackPlugin.prototype.sortsChunksByType = function (files) {
        var _this = this;
        return {
            styles: files
                .filter(function (file) { return _this.isValidExtensionByType(file, 'css'); })
                .map(function (file) { return "".concat(_this.publicPath).concat(file); }),
            scripts: files
                .filter(function (file) { return _this.isValidExtensionByType(file, 'js'); })
                .map(function (file) { return "".concat(_this.publicPath).concat(file); })
        };
    };
    /**
     * Generate HTML styles and scripts tags for each entrypoints
     * @param {Object} chunks The list of chunks of chunkGroups sorted by type
     * @returns {Object} HTML tags with all assets for an entrypoint and sorted by type
     */
    ChunksWebpackPlugin.prototype.formatTags = function (chunks) {
        var _this = this;
        return {
            styles: chunks.styles
                .map(function (chunkCSS) {
                return _this.options.templateStyle.replace('{{chunk}}', chunkCSS);
            })
                .join(''),
            scripts: chunks.scripts
                .map(function (chunkJS) { return _this.options.templateScript.replace('{{chunk}}', chunkJS); })
                .join('')
        };
    };
    /**
     * Check if the publicPath need an ending slash
     * @param {String} publicPath Public path
     * @returns {Boolean} The public path need an ending slash
     */
    ChunksWebpackPlugin.prototype.isPublicPathNeedsEndingSlash = function (publicPath) {
        return !!(publicPath && publicPath.substr(-1) !== '/');
    };
    /**
     * Check if file extension correspond to the type parameter
     * @param {String} file File path
     * @param {String} type File extension
     * @returns {Boolean} File extension is valid
     */
    ChunksWebpackPlugin.prototype.isValidExtensionByType = function (file, type) {
        return path.extname(file).substr(1) === type;
    };
    /**
     * Check if datas from customFormatTags are valid
     * @param {Object} htmlTags Formatted HTML tags by styles and scripts keys
     */
    ChunksWebpackPlugin.prototype.isValidCustomFormatTagsDatas = function (htmlTags) {
        return (htmlTags !== null &&
            typeof htmlTags.styles !== 'undefined' &&
            typeof htmlTags.scripts !== 'undefined');
    };
    /**
     * Update the class property manifest
     * which contains all chunks informations by entrypoint
     * @param {Object} options
     * @param {String} options.entryName Entrypoint name
     * @param {Object} options.chunks List of styles and scripts chunks by entrypoint
     */
    ChunksWebpackPlugin.prototype.updateManifest = function (_a) {
        var entryName = _a.entryName, chunks = _a.chunks;
        this.manifest[entryName] = {
            styles: chunks.styles,
            scripts: chunks.scripts
        };
    };
    /**
     * Create the chunks manifest file
     * Contains all scripts and styles chunks grouped by entrypoint
     */
    ChunksWebpackPlugin.prototype.createChunksManifestFile = function () {
        // Stringify the content of the manifest
        var output = JSON.stringify(this.manifest, null, 2);
        // Expose the manifest file into the assets compilation
        // The file is automatically created by the compiler
        this.createAsset({
            filename: 'chunks-manifest.json',
            output: output
        });
    };
    /**
     * Create file with HTML tags for each entrypoints
     * @param {Object} options
     * @param {String} options.entryName Entrypoint name
     * @param {Object} options.htmlTags Generated HTML of script and styles tags
     */
    ChunksWebpackPlugin.prototype.createHtmlChunksFiles = function (_a) {
        var entryName = _a.entryName, htmlTags = _a.htmlTags;
        if (htmlTags.scripts.length) {
            this.createAsset({
                entryName: entryName,
                filename: this.options.filename
                    .replace('[name]', entryName)
                    .replace('[type]', 'scripts'),
                output: htmlTags.scripts
            });
        }
        if (htmlTags.styles.length) {
            this.createAsset({
                entryName: entryName,
                filename: this.options.filename
                    .replace('[name]', entryName)
                    .replace('[type]', 'styles'),
                output: htmlTags.styles
            });
        }
    };
    /**
     * Create asset by the webpack compilation or the webpack built-in Node.js File System
     * The outputPath parameter allows to override the default webpack output path
     * Directories are automatically created by FS or the compilation
     * @param {Object} options
     * @param {String} options.entryName Entry name
     * @param {String} options.filename Filename
     * @param {String} options.output File content
     */
    ChunksWebpackPlugin.prototype.createAsset = function (_a) {
        var _this = this;
        var _b = _a.entryName, entryName = _b === void 0 ? '' : _b, filename = _a.filename, output = _a.output;
        if (this.options.outputPath) {
            var pathFromEntryName = entryName ? this.getPathFromString(entryName) : '';
            this.fs.mkdir("".concat(this.outputPath, "/").concat(this.pathFromFilename).concat(pathFromEntryName), { recursive: true }, function (error) {
                if (error)
                    throw error;
                var filePath = _this.getOutputFilePath(filename);
                _this.fs.writeFile(filePath, output, function (error) {
                    if (error)
                        throw error;
                });
            });
        }
        else {
            this.compilation.emitAsset(filename, new RawSource(output, false));
        }
    };
    /**
     * Get the output file path (outPath + filename)
     * @param {String} filename The filename
     * @returns {String} The output file path
     */
    ChunksWebpackPlugin.prototype.getOutputFilePath = function (filename) {
        return "".concat(this.outputPath).concat(filename.substr(0, 1) === '/' ? '' : '/').concat(filename);
    };
    /**
     * Throw an error
     * @param {String} message Text to display in the error
     */
    ChunksWebpackPlugin.prototype.setError = function (message) {
        throw new Error(message);
    };
    return ChunksWebpackPlugin;
}());
