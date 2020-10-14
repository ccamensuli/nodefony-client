const { merge } = require('webpack-merge');
const common = require('./webpack.common.js'); // the settings that are common to prod and dev
const TerserPlugin = require('terser-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  output: {
    filename: '[name].min.js',
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          warnings: true,
          compress: true
        },
        extractComments: true,
        cache: true,
        parallel: true
      })
    ]
  },
  module: {
    rules: []
  }
});
