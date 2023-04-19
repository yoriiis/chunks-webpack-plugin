module.exports = (api) => {
	api.cache(true);
	return {
		presets: [
			[
				'@babel/preset-env',
				{
					targets: {
						node: '14.21.2'
					}
				}
			],
			['@babel/preset-typescript']
		],
		plugins: ['babel-plugin-dynamic-import-node']
	};
};
