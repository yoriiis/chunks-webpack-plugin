module.exports = (api) => {
	const presets = [
		[
			'@babel/preset-env',
			{
				targets: {
					node: '14.21.2'
				}
			}
		],
		['@babel/preset-typescript']
	];

	const plugins = [];
	api.cache.using(() => process.env.NODE_ENV);

	if (api.env('test')) {
		plugins.push('babel-plugin-dynamic-import-node');
	}
	return {
		presets,
		plugins
	};
};
