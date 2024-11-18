const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = {
  ...config,
  watchFolders: [__dirname],
  resolver: {
    ...config.resolver,
    nodeModulesPaths: [__dirname],
  },
  watcher: {
    additionalExts: ['mjs', 'cjs'],
    watchman: {
      deferStates: ['hg.update', 'fs.drop'],
    },
  },
};