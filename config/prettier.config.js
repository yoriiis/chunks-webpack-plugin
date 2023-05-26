module.exports = {
	arrowParens: 'always',
	printWidth: 100,
	semi: true,
	singleQuote: true,
	trailingComma: 'none',
	useTabs: true,
	overrides: [
		{
			files: '*.md',
			options: {
				proseWrap: 'preserve',
				singleQuote: true,
				tabWidth: 2,
				useTabs: false
			}
		}
	],
	endOfLine: 'lf'
};
