declare const _default: {
    setError: (message: string) => never;
    isAbsolutePath: (currentPath: string) => boolean;
    getFileExtension: (file: string) => string;
    writeFile: ({ outputPath, output }: {
        outputPath: string;
        output: string;
    }) => void;
};
/**
 * Export all functions as an object
 */
export = _default;
