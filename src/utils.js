const path = require('path')
const fse = require('fs-extra')

/**
 * Throw an error
 *
 * @param {String} message Text to display in the error
 */
const setError = (message) => {
	throw new Error(message)
}

/**
 * Check if the path is absolute
 *
 * @param {String} currentPath Path
 */
const isAbsolutePath = (currentPath) => {
	return path.isAbsolute(currentPath)
}

/**
 * Get the file extension of a file path
 *
 * @param {String} file The path of the chunk filename
 *
 * @returns {String} Extension of the filename
 */
const getFileExtension = (file) => {
	return file.substr(file.lastIndexOf('.') + 1, file.length)
}

/**
 * Write content into a file with a specific output path
 *
 * @param {String} outputPath The output path of the file
 * @param {String} output The output of the file
 */
const writeFile = ({ outputPath, output }) => {
	fse.outputFileSync(outputPath, output)
}

/**
 * Export all functions as an object
 */
module.exports = {
	setError,
	isAbsolutePath,
	getFileExtension,
	writeFile
}
