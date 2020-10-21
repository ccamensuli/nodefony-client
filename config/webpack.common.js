const webpack = require('webpack');
const path = require('path');
const {
  CleanWebpackPlugin
} = require('clean-webpack-plugin');
//const ManifestPlugin = require('webpack-manifest-plugin');

module.exports = {
  /*
   * The entry point
   *
   * See: http://webpack.github.io/docs/configuration.html#entry
   */
  entry: {
    nodefony: path.resolve(__dirname, "..", "entry.es6"),
    medias: {
      import: path.resolve(__dirname, "..", 'src', 'medias', "medias.es6"),
      dependOn: 'nodefony'
    },
    //medias: path.resolve(__dirname, "..", 'src','medias',"medias.es6"),
    socket: {
      import: path.resolve(__dirname, "..", 'src', 'transports', "socket.es6"),
      dependOn: 'nodefony'
    },
    //socket: path.resolve(__dirname, "..", 'src','transports',"socket.es6"),
    webaudio: {
      import: path.resolve(__dirname, "..", 'src', 'medias', 'webaudio', "webaudio.es6"),
      dependOn: 'nodefony'
    }
    //webaudio: path.resolve(__dirname, "..", 'src','medias','webaudio',"webaudio.es6")
  },
  target: 'web',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, "../dist"),
    //publicPath:"nodefony-client/dist/",
    //globalObject: 'this',
    //library: "nodefony",
    library: {
      name: "[name]",
      type: 'umd'
    },
    libraryExport: "default"
  },

  externals: {
    nodefony: 'nodefony'
  },

  /*
   * Options affecting the resolving of modules.
   *
   * See: http://webpack.github.io/docs/configuration.html#resolve
   */
  resolve: {
    /*
     * An array of extensions that should be used to resolve modules.
     *
     * See: http://webpack.github.io/docs/configuration.html#resolve-extensions
     */
    extensions: ['.js', '.es6'],
    // An array of directory names to be resolved to the current directory
    modules: [path.resolve(__dirname, "..", "node_modules")],
    fallback: {
      "events": require.resolve("events"),
      "querystring": require.resolve("querystring-es3"),
      "url": require.resolve("url")
    }
  },
  /*
   * Options affecting the normal modules.
   *
   * See: http://webpack.github.io/docs/configuration.html#module
   */
  module: {
    rules: [{
      // BABEL TRANSCODE
      test: new RegExp("\.es6$|\.js$|\.es7$"),
      exclude: new RegExp("node_modules"),
      use: [{
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
          plugins: ['@babel/plugin-transform-runtime']
        }
      }]
    }, {
      test: /\.json$/i,
      loader: 'json5-loader',
      type: 'javascript/auto',
    }]
  },
  /*
   * Add additional plugins to the compiler.
   *
   * See: http://webpack.github.io/docs/configuration.html#plugins
   */
  plugins: [
    new CleanWebpackPlugin(),
    //new ManifestPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      }
    }),
  ],
  /*stats: {
    // lets you precisely control what bundle information gets displayed
    //preset: "errors-only",
    // A stats preset
    env: true,
    // include value of --env in the output
    outputPath: true,
    // include absolute output path in the output
    publicPath: true,
    // include public path in the output

    assets: true,
    // show list of assets in output

    entrypoints: true,
    // show entrypoints list
    chunkGroups: true,
    // show named chunk group list


    chunks: true,
    // show list of chunks in output


    modules: true,
    // show list of modules in output

    children: true,
    // show stats for child compilations

    logging: true,
    // show logging in output
    loggingDebug: /webpack/,
    // show debug type logging for some loggers
    loggingTrace: true,
    // show stack traces for warnings and errors in logging output

    warnings: true,
    // show warnings

    errors: true,
    // show errors
    errorDetails: true,
    // show details for errors
    errorStack: true,
    // show internal stack trace for errors
    moduleTrace: true,
    // show module trace for errors
    // (why was causing module referenced)

    builtAt: true,
    // show timestamp in summary
    errorsCount: true,
    // show errors count in summary
    warningsCount: true,
    // show warnings count in summary
    timings: true,
    // show build timing in summary
    version: true,
    // show webpack version in summary
    hash: true,
    // show build hash in summary
  }*/
};
