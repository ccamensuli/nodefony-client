const { merge } = require('webpack-merge');
const common = require('./webpack.common.js'); // the settings that are common to prod and dev

module.exports = merge(common, {
  mode: 'development',
  output: {
    filename: '[name].js',
  },
  module: {
    rules: []
  }
});
