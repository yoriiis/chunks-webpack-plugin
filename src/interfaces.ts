export interface Chunks {
	styles: Array<string>;
	scripts: Array<string>;
}

export interface HtmlTags {
	styles: string;
	scripts: string;
}

export interface Manifest {
	[key: string]: {
		styles: Array<string>;
		scripts: Array<string>;
	};
}

// Describe the shape of the webpack built-in Node.js File System
export interface Fs {
	mkdir: (
		filePath: string,
		options: { recursive: boolean },
		callback: (error: Error) => void
	) => void;
	writeFile: (filePath: string, output: string, callback: (error: Error) => void) => void;
}

export interface PluginOptions {
	filename: string;
	templateStyle: string;
	templateScript: string;
	outputPath: null | string;
	customFormatTags: boolean | ((chunksSorted: Chunks, Entrypoint: any) => HtmlTags);
	generateChunksManifest: boolean;
	generateChunksFiles: boolean;
}
