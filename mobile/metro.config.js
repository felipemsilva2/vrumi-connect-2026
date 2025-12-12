const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Only watch the src folder from parent for shared code (not all of parent)
config.watchFolders = [path.resolve(workspaceRoot, 'src')];

// Allow Metro to resolve from parent's src folder but keep mobile's node_modules priority
config.resolver.extraNodeModules = {
    '@': path.resolve(workspaceRoot, 'src'),
};

module.exports = config;
