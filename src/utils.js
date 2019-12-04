const path = require('path')
const fs = require('fs')

const setError = (message) => {
	throw new Error(message)
}

const isAbsolutePath = (currentPath) => {
	return path.isAbsolute(currentPath)
}

const isOutputPathValid = (outputPath) => {
	return outputPath !== '' && isAbsolutePath(outputPath)
}

/**
 * Get the file extension of a file path
 * @param {String} file The path of the chunk filename
 * @returns {String} Extension of the filename
 */
const getFileExtension = (file) => {
	return file.substr(file.lastIndexOf('.') + 1, file.length)
}

/**
 * Check if the destination folder is available
 */
const checkDestinationFolder = (path) => {
	if (!fs.existsSync(path)) {
		fs.mkdirSync(path)
	}
}

const writeFile = ({path, content}) => {
	fs.writeFileSync(path, content)
}

module.exports = {
	setError,
	isAbsolutePath,
	isOutputPathValid,
	getFileExtension,
	checkDestinationFolder,
	writeFile
}
