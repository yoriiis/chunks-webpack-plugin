module.exports = {
	env: {
		browser: true,
		es6: true,
		jest: true,
		node: true
	},

	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaFeatures: {
			impliedStrict: true,
			experimentalObjectRestSpread: true
		},
		ecmaVersion: 6,
		sourceType: 'module'
	},

	plugins: ['@typescript-eslint'],

	extends: ['standard', 'plugin:prettier/recommended', 'plugin:@typescript-eslint/recommended'],

	rules: {
		indent: [
			'error',
			'tab',
			{
				ignoredNodes: ['TemplateLiteral > *']
			}
		],
		'no-console': 0,
		'no-tabs': 0,
		semi: [1, 'always'],
		'space-before-function-paren': [
			'error',
			{
				anonymous: 'never',
				named: 'never',
				asyncArrow: 'always'
			}
		],
		'@typescript-eslint/ban-ts-comment': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-var-requires': 'off',
		'linebreak-style': ['error', 'unix']
	},

	globals: {
		document: false,
		window: false
	}
};
