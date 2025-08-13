const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  resolver: {
    alias: {
      '@': './src',
      '@/app': './src/app',
      '@/features': './src/features',
      '@/shared': './src/shared',
      '@/data': './src/data',
      '@/config': './src/config',
      'buffer': 'buffer',
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
