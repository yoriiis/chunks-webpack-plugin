declare const path: any;
declare const fse: any;
/**
 * Throw an error
 *
 * @param {String} message Text to display in the error
 */
declare const setError: (message: string) => never;
/**
 * Check if the path is absolute
 *
 * @param {String} currentPath Path
 */
declare const isAbsolutePath: (currentPath: string) => boolean;
/**
 * Get the file extension of a file path
 *
 * @param {String} file The path of the chunk filename
 *
 * @returns {String} Extension of the filename
 */
declare const getFileExtension: (file: string) => string;
/**
 * Write content into a file with a specific output path
 *
 * @param {String} outputPath The output path of the file
 * @param {String} output The output of the file
 */
declare const writeFile: ({ outputPath, output }: {
    outputPath: string;
    output: string;
}) => void;
/**
 * Export all functions as an object
 */
declare let utils: object;
