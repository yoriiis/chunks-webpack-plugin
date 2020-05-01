/**
 * @license MIT
 * @name ChunksWebpackPlugin
 * @version 6.0.1
 * @author: Yoriiis aka Joris DANIEL <joris.daniel@gmail.com>
 * @description: ChunksWebpackPlugin create HTML files to serve your webpack bundles. It is very convenient with multiple entrypoints and it works without configuration.
 * {@link https://github.com/yoriiis/chunks-webpack-plugins}
 * @copyright 2020 Joris DANIEL
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
declare const _default: {
    new (options?: {}): {
        options: {
            outputPath: string | null;
            fileExtension: string;
            templateStyle: string;
            templateScript: string;
            customFormatTags: boolean | ((chunksSorted: Chunks, files: string[]) => HtmlTags);
            generateChunksManifest: boolean;
            generateChunksFiles: boolean;
        };
        manifest: Manifest;
        compilation: any;
        entryNames: string[];
        publicPath: string;
        outputPath: string | null;
        /**
         * Apply function is automatically called by the Webpack main compiler
         *
         * @param {Object} compiler The Webpack compiler variable
         */
        apply(compiler: Compiler): void;
        /**
         * Hook expose by the Webpack compiler
         *
         * @param {Object} compilation The Webpack compilation variable
         */
        hookCallback(compilation: object): void;
        /**
         * Process for each entry
    
         * @param {String} entryName Entrypoint name
         */
        processEntry(entryName: string): void;
        /**
         * Get the public path from Webpack configuation
         * and add slash at the end if necessary
         *
         * @return {String} The public path
         */
        getPublicPath(): string;
        /**
         * Get the output path from Webpack configuation
         * or from constructor options
         *
         * @return {String} The output path
         */
        getOutputPath(): string | null;
        /**
         * Get entrypoint names from the compilation
         *
         * @return {Array} List of entrypoint names
         */
        getEntryNames(): string[];
        /**
         * Get files list by entrypoint name
         *
         * @param {String} entryName Entrypoint name
         *
         * @return {Array} List of entrypoint names
         */
        getFiles(entryName: string): string[];
        /**
         * Get HTML tags from chunks
         *
         * @param {Object} chunks Chunks sorted by type (style, script)
         * @param {Array} files List of files associated by entrypoints
         *
         * @returns {String} HTML tags by entrypoints
         */
        getHtmlTags({ chunks, files }: {
            chunks: Chunks;
            files: string[];
        }): HtmlTags | undefined;
        /**
         * Sorts all chunks by type (styles or scripts)
         *
         * @param {Array} files List of files by entrypoint name
         *
         * @returns {Object} All chunks sorted by extension type
         */
        sortsChunksByType(files: string[]): Chunks;
        /**
         * Generate HTML styles and scripts tags for each entrypoints
         *
         * @param {Object} chunks The list of chunks of chunkGroups sorted by type
         *
         * @returns {Object} HTML tags with all assets for an entrypoint and sorted by type
         */
        formatTags(chunks: Chunks): HtmlTags;
        /**
         * Check if the publicPath need an ending slash
         *
         * @param {String} publicPath Public path
         *
         * @returns {Boolean} The public path need an ending slash
         */
        isPublicPathNeedsEndingSlash(publicPath: string): boolean;
        /**
         * Check if the outputPath is valid, a string and absolute
         *
         * @returns {Boolean} outputPath is valid
         */
        isValidOutputPath(): boolean;
        /**
         * Check if file extension correspond to the type parameter
         *
         * @param {String} file File path
         * @param {String} type File extension
         *
         * @returns {Boolean} File extension is valid
         */
        isValidExtensionByType(file: string, type: string): boolean;
        /**
         * Check if datas from customFormatTags are valid
         *
         * @param {Object} htmlTags Formatted HTML tags by styles and scripts keys
         */
        isValidCustomFormatTagsDatas(htmlTags: HtmlTags): boolean;
        /**
         * Update the class property manifest
         * which contains all chunks informations by entrypoint
         *
         * @param {String} entryName Entrypoint name
         * @param {Object} chunks List of styles and scripts chunks by entrypoint
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
         *
         * @param {String} entryName Entrypoint name
         * @param {Object} htmlTags Generated HTML of script and styles tags
         */
        createHtmlChunksFiles({ entryName, htmlTags }: {
            entryName: string;
            htmlTags: HtmlTags;
        }): void;
    };
};
export = _default;
