module.exports = {
	moduleFileExtensions: ['js', 'ts'],
	extensionsToTreatAsEsm: ['.ts'],
	modulePaths: ['<rootDir>/src'],
	preset: 'ts-jest/presets/default-esm',
	// preset: 'ts-jest/presets/js-with-babel',
	rootDir: '../',
	resetModules: true,
	transform: {
		// '\\.js$': ['babel-jest', { configFile: './config/babel.config.js' }]
		'\\.(js|ts)$': [
			'ts-jest',
			{
				babelConfig: '<rootDir>/config/babel.config.cjs',
				useESM: true,
				isolatedModules: true
			}
		]
	},
	moduleNameMapper: {
		'^@src(.*)$': '<rootDir>/src$1'
	},
	testMatch: ['<rootDir>/tests/*.test.js'],
	verbose: true,
	resetMocks: true,
	clearMocks: true
};
