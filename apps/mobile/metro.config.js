const { getDefaultConfig } = require('expo/metro-config');
const { withParishProfile } = require('@parish/parishes/select');

module.exports = withParishProfile(getDefaultConfig(__dirname));
