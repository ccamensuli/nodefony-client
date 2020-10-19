const {
  merge
} = require('webpack-merge');
const common = require('./webpack.common.js'); // the settings that are common to prod and dev
const TerserPlugin = require('terser-webpack-plugin');
const SriPlugin = require('webpack-subresource-integrity');

module.exports = merge(common, {
  mode: 'production',
  output: {
    crossOriginLoading: 'anonymous'
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          warnings: true,
          compress: true
        },
        extractComments: true,
        parallel: true
      })
    ]
  },
  module: {
    rules: []
  },
  plugins: [
    new SriPlugin({
      hashFuncNames: ['sha256', 'sha384'],
      enabled: true
    })
  ]
});
