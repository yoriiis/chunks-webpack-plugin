interface Fs {
    existsSync: Function;
    mkdirSync: Function;
    writeFileSync: Function;
}
declare const _default: {
    setError: (message: string) => never;
    isAbsolutePath: (currentPath: string) => boolean;
    getFileExtension: (file: string) => string;
    writeFile: ({ fs, outputPath, output }: {
        fs: Fs;
        outputPath: string;
        output: string;
    }) => void;
};
/**
 * Export all functions as an object
 */
export = _default;
