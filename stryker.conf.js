/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */
module.exports = {
	mutator: 'javascript',
	packageManager: 'npm',
	testRunner: 'jest',
	coverageAnalysis: 'all',
	reporters: ['dashboard', 'html', 'clear-text', 'progress'],
	mutate: ['./src/**/*.js', '!./src/__tests__/**/*.js'],
	thresholds: {
		high: 80,
		low: 60,
		break: null
	}
};
