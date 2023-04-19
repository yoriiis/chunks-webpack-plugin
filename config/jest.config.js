module.exports = {
	moduleFileExtensions: ['js', 'ts'],
	modulePaths: ['<rootDir>/src'],
	preset: 'ts-jest/presets/js-with-babel',
	rootDir: '../',
	resetModules: true,
	transform: {
		'\\.(js|ts)$': ['ts-jest', { configFile: './config/babel.config.js' }]
	},
	verbose: true
};
