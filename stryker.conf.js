/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */
module.exports = {
	mutator: 'javascript',
	packageManager: 'npm',
	reporters: ['html', 'clear-text', 'progress'],
	testRunner: 'jest',
	coverageAnalysis: 'all',
	mutate: ['./src/**/*.js', '!./src/__tests__/**/*.js'],
	thresholds: {
		high: 80,
		low: 60,
		break: null
	}
};
