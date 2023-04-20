import { type Asset } from 'webpack';

export interface Data {
	filePath: Array<string>;
	htmlTags: string;
}

export interface Chunks {
	css: Array<Asset>;
	js: Array<Asset>;
}

export interface HtmlTags {
	css: string;
	js: string;
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
	templateStyle: (name: string, entryName: string) => string;
	templateScript: (name: string, entryName: string) => string;
	generateChunksManifest: boolean;
	generateChunksFiles: boolean;
}
