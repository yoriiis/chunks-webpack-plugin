/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */
module.exports = {
	mutator: 'typescript',
	packageManager: 'npm',
	jest: {
		configFile: './config/jest.config.js'
	},
	testRunner: 'jest',
	coverageAnalysis: 'off',
	tsconfigFile: 'tsconfig.json',
	reporters: ['dashboard', 'html', 'clear-text', 'progress'],
	mutate: ['./src/**/*.js', './src/**/*.ts'],
	thresholds: {
		high: 80,
		low: 60,
		break: null
	}
};
