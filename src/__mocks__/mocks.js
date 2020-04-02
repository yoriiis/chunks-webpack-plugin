import utils from '../utils';

export function mockGetEntryName (chunksWebpackPlugin) {
	chunksWebpackPlugin.getEntryNames = jest.fn().mockImplementation(() => {
		return ['app-a', 'app-b'];
	});
}

export function mockGetFiles (chunksWebpackPlugin, files) {
	chunksWebpackPlugin.getFiles = jest.fn().mockImplementation(() => {
		return files;
	});
}

export function mockHasCustomFormatTags (chunksWebpackPlugin, chunks) {
	chunksWebpackPlugin.hasCustomFormatTags = jest.fn().mockImplementation(() => {
		return true;
	});
}
export function mockGetHtmlTags (chunksWebpackPlugin, htmlTags) {
	chunksWebpackPlugin.getHtmlTags = jest.fn().mockImplementation(() => {
		return htmlTags;
	});
}

export function mockCustomFormatTags (chunksWebpackPlugin, htmlTags) {
	chunksWebpackPlugin.options.customFormatTags = jest.fn().mockImplementation(() => {
		return htmlTags;
	});
}

export function mockIsValidCustomFormatTagsDatas (chunksWebpackPlugin, status) {
	chunksWebpackPlugin.isValidCustomFormatTagsDatas = jest.fn().mockImplementation(() => {
		return status;
	});
}

export function mockSortsChunksByType (chunksWebpackPlugin, chunks) {
	chunksWebpackPlugin.sortsChunksByType = jest.fn().mockImplementation(() => {
		return chunks;
	});
}

export function mockPublicPathNeedEndingSlash (chunksWebpackPlugin, status) {
	chunksWebpackPlugin.publicPathNeedEndingSlash = jest.fn().mockImplementation(() => {
		return status;
	});
}

export function mockIsValidOutputPath (chunksWebpackPlugin, status) {
	chunksWebpackPlugin.isValidOutputPath = jest.fn().mockImplementation(() => {
		return status;
	});
}

export function mockIsAbsolutePath (status) {
	utils.isAbsolutePath = jest.fn().mockImplementation(() => {
		return status;
	});
}
