export default {
	moduleFileExtensions: ['js', 'ts'],
	modulePaths: ['<rootDir>/src'],
	rootDir: '../',
	resetModules: true,
	transform: {
		'\\.(js|ts)$': [
			'ts-jest',
			{
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
