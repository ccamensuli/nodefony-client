const path = require("path");
const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const {
  merge
} = require('webpack-merge');
const precss = require('precss');
const autoprefixer = require('autoprefixer');

// Default context <bundle base directory>
//const context = path.resolve(__dirname, "..", "Resources", "public");
const public = path.resolve(__dirname, "..", "Resources", "public", "assets");
const package = require(path.resolve("package.json"));

const bundleConfig = require(path.resolve(__dirname, "config.js"));
const bundleName = package.name;
const publicPath = "/app/assets/";

let wpconfig = null;
let dev = true;
if (kernel.environment === "dev") {
  wpconfig = require("./webpack/webpack.dev.config.js");
} else {
  wpconfig = require("./webpack/webpack.prod.config.js");
  dev = false;
}

//const debug = kernel.debug ? "SIP" : false ;
const debug = kernel.debug ? "*" : false ;
//const debug = kernel.debug ? "*" : false ;

module.exports = merge(wpconfig, {
  //context: context,
  target: "web",
  entry: {
    app: ["./Resources/js/app.js"],
    tests: ["./Resources/js/tests.js"],
    sip: ["./Resources/js/sip.js"],
    webrtc: ["./Resources/js/webrtc.js"],
    api: ["./Resources/js/api.js"]
  },
  output: {
    path: public,
    publicPath: publicPath,
    filename: "./js/[name].js",
    library: "[name]",
    libraryExport: "default"
  },
  externals: {},
  resolve: {
    /*symlinks: true,
    alias:{
      "nodefony-client": path.resolve(__dirname, "..", "..", "..", "..", "..","nodefony-client")
    },*/
    modules: [
      path.resolve(__dirname, "..", 'node_modules'),
      path.resolve(__dirname, "..", "..", 'node_modules'),
      path.resolve(__dirname, "..", "..", "..", "..", 'node_modules'),
    ],
    extensions: ['.js', '.es6'],
    fallback: {
      //"events": require.resolve("events"),
      //"querystring": require.resolve("querystring-es3"),
      //"url": require.resolve("url")
    }
  },
  module: {
    rules: [{
        // BABEL TRANSCODE
        test: new RegExp("\\.es6$|\\.js$"),
        exclude: new RegExp("node_modules"),
        use: [{
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-runtime']
          }
        }]
      }, {
        test: /\.(sa|sc|c)ss$/,
        use: [
          //'css-hot-loader',
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              sourceMap: true
            }
          }, {
            loader: 'resolve-url-loader',
            options: {}
          }, {
            loader: 'postcss-loader', // Run post css actions
            options: {
              postcssOptions: {
                plugins: [autoprefixer({}), precss({})]
              }
            }
          }, {
            loader: "sass-loader",
            options: {
              sourceMap: true
            }
          }
        ]
      }, {
        test: /.(ttf|otf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'fonts/', // where the fonts will go
            publicPath: `${publicPath}/fonts/` // override the default path
          }
        }]
      }, {
        // IMAGES
        test: /\.(gif|png|jpe?g|svg)$/i,
        use: [{
          loader: "file-loader",
          options: {
            name: "[name].[ext]",
            publicPath: `${publicPath}/images/`,
            outputPath: "/images/"
          }
          }]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "./css/[name].css"
    }),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        "NODE_DEBUG":JSON.stringify(debug),
        "NODEFONY_DOMAIN": JSON.stringify(kernel.domain)
      }
    }),
  ],
  devServer: {
    inline: true,
    hot: false
  }
});
