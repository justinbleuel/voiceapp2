// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = {
  ...config,
  watchFolders: [__dirname],
  maxWorkers: 2,  // Reduce the number of workers
  transformer: {
    ...config.transformer,
    assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  },
};