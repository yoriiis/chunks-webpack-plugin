"use strict";
/**
 * @license MIT
 * @name ChunksWebpackPlugin
 * @version 6.0.1
 * @author: Yoriiis aka Joris DANIEL <joris.daniel@gmail.com>
 * @description: ChunksWebpackPlugin create HTML files to serve your webpack bundles. It is very convenient with multiple entrypoints and it works without configuration.
 * {@link https://github.com/yoriiis/chunks-webpack-plugins}
 * @copyright 2020 Joris DANIEL
 **/
var utils = require("./utils");
module.exports = /** @class */ (function () {
    /**
     * Instanciate the constructor
     * @param {options}
     */
    function ChunksWebpackPlugin(options) {
        if (options === void 0) { options = {}; }
        // Merge default options with user options
        this.options = Object.assign({
            outputPath: null,
            fileExtension: '.html',
            templateStyle: '<link rel="stylesheet" href="{{chunk}}" />',
            templateScript: '<script src="{{chunk}}"></script>',
            customFormatTags: false,
            generateChunksManifest: false,
            generateChunksFiles: true
        }, options);
        this.manifest = {};
    }
    /**
     * Apply function is automatically called by the Webpack main compiler
     *
     * @param {Object} compiler The Webpack compiler variable
     */
    ChunksWebpackPlugin.prototype.apply = function (compiler) {
        compiler.hooks.emit.tap('ChunksWebpackPlugin', this.hookCallback.bind(this));
    };
    /**
     * Hook expose by the Webpack compiler
     *
     * @param {Object} compilation The Webpack compilation variable
     */
    ChunksWebpackPlugin.prototype.hookCallback = function (compilation) {
        var _this = this;
        this.compilation = compilation;
        this.publicPath = this.getPublicPath();
        this.outputPath = this.getOutputPath();
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
        var htmlTags = this.getHtmlTags({ chunks: chunks, files: files });
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
     *
     * @return {String} The public path
     */
    ChunksWebpackPlugin.prototype.getPublicPath = function () {
        var publicPath = this.compilation.options.output.publicPath || '';
        return "" + publicPath + (this.isPublicPathNeedsEndingSlash(publicPath) ? '/' : '');
    };
    /**
     * Get the output path from Webpack configuation
     * or from constructor options
     *
     * @return {String} The output path
     */
    ChunksWebpackPlugin.prototype.getOutputPath = function () {
        if (this.isValidOutputPath()) {
            return this.options.outputPath;
        }
        else {
            return this.compilation.options.output.path || '';
        }
    };
    /**
     * Get entrypoint names from the compilation
     *
     * @return {Array} List of entrypoint names
     */
    ChunksWebpackPlugin.prototype.getEntryNames = function () {
        return Array.from(this.compilation.entrypoints.keys());
    };
    /**
     * Get files list by entrypoint name
     *
     * @param {String} entryName Entrypoint name
     *
     * @return {Array} List of entrypoint names
     */
    ChunksWebpackPlugin.prototype.getFiles = function (entryName) {
        return this.compilation.entrypoints.get(entryName).getFiles();
    };
    /**
     * Get HTML tags from chunks
     *
     * @param {Object} chunks Chunks sorted by type (style, script)
     * @param {Array} files List of files associated by entrypoints
     *
     * @returns {String} HTML tags by entrypoints
     */
    ChunksWebpackPlugin.prototype.getHtmlTags = function (_a) {
        var chunks = _a.chunks, files = _a.files;
        // The user prefers to generate his own HTML tags, use his object
        if (typeof this.options.customFormatTags === 'function') {
            var htmlTags = this.options.customFormatTags(chunks, files);
            // Check if datas are correctly formatted
            if (this.isValidCustomFormatTagsDatas(htmlTags)) {
                return htmlTags;
            }
            else {
                utils.setError('ChunksWebpackPlugin::customFormatTags return invalid object');
            }
        }
        else {
            // Default behavior, generate HTML tags with templateStyle and templateScript options
            return this.formatTags(chunks);
        }
    };
    /**
     * Sorts all chunks by type (styles or scripts)
     *
     * @param {Array} files List of files by entrypoint name
     *
     * @returns {Object} All chunks sorted by extension type
     */
    ChunksWebpackPlugin.prototype.sortsChunksByType = function (files) {
        var _this = this;
        return {
            styles: files
                .filter(function (file) { return _this.isValidExtensionByType(file, 'css'); })
                .map(function (file) { return "" + _this.publicPath + file; }),
            scripts: files
                .filter(function (file) { return _this.isValidExtensionByType(file, 'js'); })
                .map(function (file) { return "" + _this.publicPath + file; })
        };
    };
    /**
     * Generate HTML styles and scripts tags for each entrypoints
     *
     * @param {Object} chunks The list of chunks of chunkGroups sorted by type
     *
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
     *
     * @param {String} publicPath Public path
     *
     * @returns {Boolean} The public path need an ending slash
     */
    ChunksWebpackPlugin.prototype.isPublicPathNeedsEndingSlash = function (publicPath) {
        return !!(publicPath && publicPath.substr(-1) !== '/');
    };
    /**
     * Check if the outputPath is valid, a string and absolute
     *
     * @returns {Boolean} outputPath is valid
     */
    ChunksWebpackPlugin.prototype.isValidOutputPath = function () {
        return !!(this.options.outputPath && utils.isAbsolutePath(this.options.outputPath));
    };
    /**
     * Check if file extension correspond to the type parameter
     *
     * @param {String} file File path
     * @param {String} type File extension
     *
     * @returns {Boolean} File extension is valid
     */
    ChunksWebpackPlugin.prototype.isValidExtensionByType = function (file, type) {
        return utils.getFileExtension(file) === type;
    };
    /**
     * Check if datas from customFormatTags are valid
     *
     * @param {Object} htmlTags Formatted HTML tags by styles and scripts keys
     */
    ChunksWebpackPlugin.prototype.isValidCustomFormatTagsDatas = function (htmlTags) {
        return (htmlTags !== null &&
            typeof htmlTags.styles !== 'undefined' &&
            typeof htmlTags.scripts !== 'undefined' &&
            htmlTags.styles !== '' &&
            htmlTags.scripts !== '');
    };
    /**
     * Update the class property manifest
     * which contains all chunks informations by entrypoint
     *
     * @param {String} entryName Entrypoint name
     * @param {Object} chunks List of styles and scripts chunks by entrypoint
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
        this.compilation.assets['chunks-manifest.json'] = {
            source: function () { return output; },
            size: function () { return output.length; }
        };
    };
    /**
     * Create file with HTML tags for each entrypoints
     *
     * @param {String} entryName Entrypoint name
     * @param {Object} htmlTags Generated HTML of script and styles tags
     */
    ChunksWebpackPlugin.prototype.createHtmlChunksFiles = function (_a) {
        var entryName = _a.entryName, htmlTags = _a.htmlTags;
        if (htmlTags.scripts.length) {
            utils.writeFile({
                outputPath: this.outputPath + "/" + entryName + "-scripts" + this.options.fileExtension,
                output: htmlTags.scripts
            });
        }
        if (htmlTags.styles.length) {
            utils.writeFile({
                outputPath: this.outputPath + "/" + entryName + "-styles" + this.options.fileExtension,
                output: htmlTags.styles
            });
        }
    };
    return ChunksWebpackPlugin;
}());
