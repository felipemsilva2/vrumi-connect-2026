module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            'module:react-native-dotenv',
            [
                'module-resolver',
                {
                    alias: {
                        '@/integrations': '../src/integrations',
                        '@': './src',
                        '@components': './components',
                        '@contexts': './contexts',
                        '@hooks': './hooks',
                        'lodash': './node_modules/lodash'
                    }
                }
            ],
            'react-native-reanimated/plugin'
        ]
    };
};
