import path = require('path');

// Describe the shape of the Fs object
interface Fs {
	existsSync: Function;
	mkdirSync: Function;
	writeFileSync: Function;
}

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
 * @param {Object} fs The input file system from the webpack compiler
 * @param {String} outputPath The output path of the file
 * @param {String} output The output of the file
 */
const writeFile = ({ fs, outputPath, output }: { fs: Fs; outputPath: string; output: string }) => {
	// Check if the path contains missing directories, else we create them recursively
	const dir = path.dirname(outputPath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	fs.writeFileSync(outputPath, output);
};

/**
 * Export all functions as an object
 */
export = { setError, isAbsolutePath, getFileExtension, writeFile };
