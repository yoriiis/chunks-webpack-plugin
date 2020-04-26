"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = __importDefault(require("path"));
var fs_extra_1 = __importDefault(require("fs-extra"));
/**
 * Throw an error
 *
 * @param {String} message Text to display in the error
 */
var setError = function (message) {
    throw new Error(message);
};
exports.setError = setError;
/**
 * Check if the path is absolute
 *
 * @param {String} currentPath Path
 */
var isAbsolutePath = function (currentPath) {
    return path_1.default.isAbsolute(currentPath);
};
exports.isAbsolutePath = isAbsolutePath;
/**
 * Get the file extension of a file path
 *
 * @param {String} file The path of the chunk filename
 *
 * @returns {String} Extension of the filename
 */
var getFileExtension = function (file) {
    return path_1.default.extname(file).substr(1);
};
exports.getFileExtension = getFileExtension;
/**
 * Write content into a file with a specific output path
 *
 * @param {String} outputPath The output path of the file
 * @param {String} output The output of the file
 */
var writeFile = function (_a) {
    var outputPath = _a.outputPath, output = _a.output;
    fs_extra_1.default.outputFileSync(outputPath, output);
};
exports.writeFile = writeFile;
