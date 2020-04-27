import path = require('path');
import fse = require('fs-extra');

/**
 * Throw an error
 *
 * @param {String} message Text to display in the error
 */
const setError = (message: string): never => {
	throw new Error(message);
};

/**
 * Check if the path is absolute
 *
 * @param {String} currentPath Path
 */
const isAbsolutePath = (currentPath: string): boolean => {
	return path.isAbsolute(currentPath);
};

/**
 * Get the file extension of a file path
 *
 * @param {String} file The path of the chunk filename
 *
 * @returns {String} Extension of the filename
 */
const getFileExtension = (file: string): string => {
	return path.extname(file).substr(1);
};

/**
 * Write content into a file with a specific output path
 *
 * @param {String} outputPath The output path of the file
 * @param {String} output The output of the file
 */
const writeFile = ({ outputPath, output }: { outputPath: string; output: string }) => {
	fse.outputFileSync(outputPath, output);
};

/**
 * Export all functions as an object
 */
export = { setError, isAbsolutePath, getFileExtension, writeFile };
