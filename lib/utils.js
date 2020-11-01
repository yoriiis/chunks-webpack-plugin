"use strict";
var path = require("path");
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
 * @param {Object} fs The input file system from the webpack compiler
 * @param {String} outputPath The output path of the file
 * @param {String} output The output of the file
 */
var writeFile = function (_a) {
    var fs = _a.fs, outputPath = _a.outputPath, output = _a.output;
    // Check if the path contains missing directories, else we create them recursively
    var dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, output);
};
module.exports = { setError: setError, isAbsolutePath: isAbsolutePath, getFileExtension: getFileExtension, writeFile: writeFile };
