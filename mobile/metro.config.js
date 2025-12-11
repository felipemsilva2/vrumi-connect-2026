const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the parent directory (web project) for shared code
config.watchFolders = [workspaceRoot];

// Let Metro know where to resolve packages
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// Avoid resolving web-specific packages that won't work in React Native
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Handle potential conflicts
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
