const {
  merge
} = require('webpack-merge');
const common = require('./webpack.common.js'); // the settings that are common to prod and dev
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = merge(common, {
  mode: 'development',
  devtool: 'source-map',
  watch: true,
  module: {
    rules: []
  },
  plugins: [
   new BundleAnalyzerPlugin()
  ]
});
