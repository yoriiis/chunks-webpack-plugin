module.exports = {
	moduleFileExtensions: ['js', 'ts'],
	modulePaths: ['<rootDir>/src'],
	preset: 'ts-jest/presets/js-with-babel',
	rootDir: '../',
	resetModules: true,
	transform: {
		'\\.(js|ts)$': ['ts-jest', { configFile: './config/babel.config.js' }]
	},
	moduleNameMapper: {
		'^@src(.*)$': '<rootDir>/src$1'
	},
	testMatch: ['<rootDir>/tests/*.test.js'],
	verbose: true
};
