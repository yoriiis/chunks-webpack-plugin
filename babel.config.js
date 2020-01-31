module.exports = function (api) {
	const presets = [
		[
			'@babel/preset-env',
			{
				targets: {
					node: '8.11.2'
				}
			}
		]
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
