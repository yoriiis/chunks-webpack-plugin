import utils from '../utils';

/**
 * Mock implementation of getEntryNames function
 *
 * @param {Class} chunksWebpackPlugin Instance of chunksWebpackPlugin
 */
export function mockGetEntryNames(chunksWebpackPlugin, entryNames) {
	chunksWebpackPlugin.getEntryNames = jest.fn().mockImplementation(() => {
		return entryNames;
	});
}

/**
 * Mock implementation of getFiles function
 *
 * @param {Class} chunksWebpackPlugin Instance of chunksWebpackPlugin
 * @param {Array} files List of entrypoint names
 */
export function mockGetFiles(chunksWebpackPlugin, files) {
	chunksWebpackPlugin.getFiles = jest.fn().mockImplementation(() => {
		return files;
	});
}

/**
 * Mock implementation of hasCustomFormatTags function
 *
 * @param {Class} chunksWebpackPlugin Instance of chunksWebpackPlugin
 * @param {Boolean} status Status of the return of the function
 */
export function mockHasCustomFormatTags(chunksWebpackPlugin, status) {
	chunksWebpackPlugin.hasCustomFormatTags = jest.fn().mockImplementation(() => {
		return status;
	});
}

/**
 * Mock implementation of getHtmlTags function
 *
 * @param {Class} chunksWebpackPlugin Instance of chunksWebpackPlugin
 * @param {Object} htmlTags HTML tags with all assets for an entrypoint and sorted by type
 */
export function mockGetHtmlTags(chunksWebpackPlugin, htmlTags) {
	chunksWebpackPlugin.getHtmlTags = jest.fn().mockImplementation(() => {
		return htmlTags;
	});
}

/**
 * Mock implementation of customFormatTags function
 *
 * @param {Class} chunksWebpackPlugin Instance of chunksWebpackPlugin
 * @param {Object} htmlTags HTML tags with all assets for an entrypoint and sorted by type
 */
export function mockCustomFormatTags(chunksWebpackPlugin, htmlTags) {
	chunksWebpackPlugin.options.customFormatTags = jest.fn().mockImplementation(() => {
		return htmlTags;
	});
}

/**
 * Mock implementation of isValidCustomFormatTagsDatas function
 *
 * @param {Class} chunksWebpackPlugin Instance of chunksWebpackPlugin
 * @param {Boolean} status Status of the return of the function
 */
export function mockIsValidCustomFormatTagsDatas(chunksWebpackPlugin, status) {
	chunksWebpackPlugin.isValidCustomFormatTagsDatas = jest.fn().mockImplementation(() => {
		return status;
	});
}

/**
 * Mock implementation of sortsChunksByType function
 *
 * @param {Class} chunksWebpackPlugin Instance of chunksWebpackPlugin
 * @param {Object} chunks All chunks sorted by extension type
 */
export function mockSortsChunksByType(chunksWebpackPlugin, chunks) {
	chunksWebpackPlugin.sortsChunksByType = jest.fn().mockImplementation(() => {
		return chunks;
	});
}

/**
 * Mock implementation of isPublicPathNeedsEndingSlash function
 *
 * @param {Class} chunksWebpackPlugin Instance of chunksWebpackPlugin
 * @param {Boolean} status Status of the return of the function
 */
export function mockIsPublicPathNeedsEndingSlash(chunksWebpackPlugin, status) {
	chunksWebpackPlugin.isPublicPathNeedsEndingSlash = jest.fn().mockImplementation(() => {
		return status;
	});
}

/**
 * Mock implementation of isValidOutputPath function
 *
 * @param {Class} chunksWebpackPlugin Instance of chunksWebpackPlugin
 * @param {Boolean} status Status of the return of the function
 */
export function mockIsValidOutputPath(chunksWebpackPlugin, status) {
	chunksWebpackPlugin.isValidOutputPath = jest.fn().mockImplementation(() => {
		return status;
	});
}

/**
 * Mock implementation of utils.isAbsolutePath function
 *
 * @param {Boolean} status Status of the return of the function
 */
export function mockIsAbsolutePath(status) {
	utils.isAbsolutePath = jest.fn().mockImplementation(() => {
		return status;
	});
}
