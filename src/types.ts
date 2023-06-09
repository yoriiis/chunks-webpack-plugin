import type { Asset, sources } from 'webpack';

export type FilesDependencies = {
	css: Asset[];
	js: Asset[];
};

export type EntryCssData = {
	entryName: string;
	source: sources.RawSource;
};

export type EntryJsData = {
	entryName: string;
	source: sources.RawSource;
};

export type AllData = {
	entryName: string;
	css: {
		source: sources.RawSource | null;
	};
	js: {
		source: sources.RawSource | null;
	};
};

export type AssetData = {
	filePath: string[];
	htmlTags: string;
};

export type EntryCache = {
	source: sources.RawSource;
	filePath: string[];
	htmlTags: string;
	filename: string;
};

type ManifestItem = {
	styles: string[];
	scripts: string[];
};

export type Manifest = Record<string, ManifestItem>;
export type TemplateFunction = (name: string, entryName: string) => string;

export type PluginOptions = {
	filename: string;
	templateStyle: TemplateFunction;
	templateScript: TemplateFunction;
	generateChunksManifest: boolean;
	generateChunksFiles: boolean;
};

export type PublicPath = {
	html: string;
	manifest: string;
};
