import { type Asset, type sources } from 'webpack';

export interface FilesDependencies {
	css: Array<Asset>;
	js: Array<Asset>;
}

export interface AllData {
	entryName: string;
	css?: {
		source: sources.RawSource;
	};
	js?: {
		source: sources.RawSource;
	};
}

export interface AssetData {
	filePath: Array<string>;
	htmlTags: string;
}

export interface EntryCache {
	source: sources.RawSource;
	filePath: Array<string>;
	htmlTags: string;
	filename: string;
}

export interface Manifest {
	[key: string]: {
		styles: Array<string>;
		scripts: Array<string>;
	};
}

export type TemplateFunction = (name: string, entryName: string) => string;

export interface PluginOptions {
	filename: string;
	templateStyle: TemplateFunction;
	templateScript: TemplateFunction;
	generateChunksManifest: boolean;
	generateChunksFiles: boolean;
}
