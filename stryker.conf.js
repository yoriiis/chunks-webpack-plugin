/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */
module.exports = {
	mutator: 'typescript',
	packageManager: 'npm',
	testRunner: 'jest',
	coverageAnalysis: 'off',
	tsconfigFile: 'tsconfig.json',
	reporters: ['dashboard', 'html', 'clear-text', 'progress'],
	mutate: [
		'./src/**/*.js',
		'./src/**/*.ts',
		'!./src/__tests__/**/*.js',
		'!./src/__mocks__/**/*.js'
	],
	thresholds: {
		high: 80,
		low: 60,
		break: null
	}
};
