"use strict";
var path = require('path');
var fse = require('fs-extra');
/**
 * Throw an error
 *
 * @param {String} message Text to display in the error
 */
var setError = function (message) {
    throw new Error(message);
};
/**
 * Check if the path is absolute
 *
 * @param {String} currentPath Path
 */
var isAbsolutePath = function (currentPath) {
    return path.isAbsolute(currentPath);
};
/**
 * Get the file extension of a file path
 *
 * @param {String} file The path of the chunk filename
 *
 * @returns {String} Extension of the filename
 */
var getFileExtension = function (file) {
    return path.extname(file).substr(1);
};
/**
 * Write content into a file with a specific output path
 *
 * @param {String} outputPath The output path of the file
 * @param {String} output The output of the file
 */
var writeFile = function (_a) {
    var outputPath = _a.outputPath, output = _a.output;
    fse.outputFileSync(outputPath, output);
};
module.exports = {
    setError: setError,
    isAbsolutePath: isAbsolutePath,
    getFileExtension: getFileExtension,
    writeFile: writeFile
};
