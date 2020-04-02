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
