/**
 * @license MIT
 * @name ChunksWebpackPlugin
 * @version 7.1.0
 * @author: Yoriiis aka Joris DANIEL <joris.daniel@gmail.com>
 * @description: ChunksWebpackPlugin create HTML files to serve your webpack bundles. It is very convenient with multiple entrypoints and it works without configuration.
 * {@link https://github.com/yoriiis/chunks-webpack-plugins}
 * @copyright 2023 Joris DANIEL
 **/
import { Compiler } from 'webpack';
interface Chunks {
    styles: Array<string>;
    scripts: Array<string>;
}
interface HtmlTags {
    styles: string;
    scripts: string;
}
interface Manifest {
    [key: string]: {
        styles: Array<string>;
        scripts: Array<string>;
    };
}
interface Fs {
    mkdir: (filePath: string, options: {
        recursive: boolean;
    }, callback: (error: Error) => void) => void;
    writeFile: (filePath: string, output: string, callback: (error: Error) => void) => void;
}
declare const _default: {
    new (options?: {}): {
        options: {
            outputPath: null | string;
            filename: string;
            templateStyle: string;
            templateScript: string;
            customFormatTags: boolean | ((chunksSorted: Chunks, Entrypoint: any) => HtmlTags);
            generateChunksManifest: boolean;
            generateChunksFiles: boolean;
        };
        manifest: Manifest;
        fs: Fs;
        compilation: any;
        entryNames: Array<string>;
        publicPath: string;
        outputPath: null | string;
        pathFromFilename: string;
        /**
         * Apply function is automatically called by the Webpack main compiler
         * @param {Object} compiler The Webpack compiler variable
         */
        apply(compiler: Compiler): void;
        /**
         * Hook expose by the Webpack compiler
         * @param {Object} compilation The Webpack compilation variable
         */
        hookCallback(compilation: object): void;
        /**
         * Add assets
         * The hook is triggered by webpack
         */
        addAssets(): void;
        /**
         * Process for each entry
         * @param {String} entryName Entrypoint name
         */
        processEntry(entryName: string): void;
        /**
         * Get the public path from Webpack configuation
         * and add slash at the end if necessary
         * @return {String} The public path
         */
        getPublicPath(): string;
        /**
         * Get the output path from Webpack configuation
         * or from constructor options
         * @return {String} The output path
         */
        getOutputPath(): string | null;
        /**
         * Get the path inside a string if it exists
         * Filename can contain a directory
         * @returns {String} The outpath path extract from the filename
         */
        getPathFromString(filename: string): string;
        /**
         * Check if the outputPath is valid, a string and absolute
         * @returns {Boolean} outputPath is valid
         */
        isValidOutputPath(): boolean;
        /**
         * Get entrypoint names from the compilation
         * @return {Array} List of entrypoint names
         */
        getEntryNames(): Array<string>;
        /**
         * Get files list by entrypoint name
         *
         * @param {String} entryName Entrypoint name
         * @return {Array} List of entrypoint names
         */
        getFiles(entryName: string): Array<string>;
        /**
         * Get HTML tags from chunks
         * @param {Object} options
         * @param {Object} options.chunks Chunks sorted by type (style, script)
         * @param {Object} options.Entrypoint Entrypoint object part of a single ChunkGroup
         * @returns {String} HTML tags by entrypoints
         */
        getHtmlTags({ chunks, Entrypoint }: {
            chunks: Chunks;
            Entrypoint: any;
        }): undefined | HtmlTags;
        /**
         * Sorts all chunks by type (styles or scripts)
         * @param {Array} files List of files by entrypoint name
         * @returns {Object} All chunks sorted by extension type
         */
        sortsChunksByType(files: Array<string>): Chunks;
        /**
         * Generate HTML styles and scripts tags for each entrypoints
         * @param {Object} chunks The list of chunks of chunkGroups sorted by type
         * @returns {Object} HTML tags with all assets for an entrypoint and sorted by type
         */
        formatTags(chunks: Chunks): HtmlTags;
        /**
         * Check if the publicPath need an ending slash
         * @param {String} publicPath Public path
         * @returns {Boolean} The public path need an ending slash
         */
        isPublicPathNeedsEndingSlash(publicPath: string): boolean;
        /**
         * Check if file extension correspond to the type parameter
         * @param {String} file File path
         * @param {String} type File extension
         * @returns {Boolean} File extension is valid
         */
        isValidExtensionByType(file: string, type: string): boolean;
        /**
         * Check if datas from customFormatTags are valid
         * @param {Object} htmlTags Formatted HTML tags by styles and scripts keys
         */
        isValidCustomFormatTagsDatas(htmlTags: HtmlTags): boolean;
        /**
         * Update the class property manifest
         * which contains all chunks informations by entrypoint
         * @param {Object} options
         * @param {String} options.entryName Entrypoint name
         * @param {Object} options.chunks List of styles and scripts chunks by entrypoint
         */
        updateManifest({ entryName, chunks }: {
            entryName: string;
            chunks: Chunks;
        }): void;
        /**
         * Create the chunks manifest file
         * Contains all scripts and styles chunks grouped by entrypoint
         */
        createChunksManifestFile(): void;
        /**
         * Create file with HTML tags for each entrypoints
         * @param {Object} options
         * @param {String} options.entryName Entrypoint name
         * @param {Object} options.htmlTags Generated HTML of script and styles tags
         */
        createHtmlChunksFiles({ entryName, htmlTags }: {
            entryName: string;
            htmlTags: HtmlTags;
        }): void;
        /**
         * Create asset by the webpack compilation or the webpack built-in Node.js File System
         * The outputPath parameter allows to override the default webpack output path
         * Directories are automatically created by FS or the compilation
         * @param {Object} options
         * @param {String} options.entryName Entry name
         * @param {String} options.filename Filename
         * @param {String} options.output File content
         */
        createAsset({ entryName, filename, output }: {
            entryName?: string | undefined;
            filename: string;
            output: string;
        }): void;
        /**
         * Get the output file path (outPath + filename)
         * @param {String} filename The filename
         * @returns {String} The output file path
         */
        getOutputFilePath(filename: string): string;
        /**
         * Throw an error
         * @param {String} message Text to display in the error
         */
        setError(message: string): void;
    };
};
export = _default;
