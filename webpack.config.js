const path = require('path');
const devConfigPath = path.resolve(__dirname, "config", "webpack.dev.js");
const prodConfigPath = path.resolve(__dirname, "config", "webpack.prod.js");

module.exports = env => {
  if (env.production){
    process.env.NODE_ENV = "production";
    let conf = require(prodConfigPath);
    //console.log(conf)
    return conf;
  }
  if (env.development){
    process.env.NODE_ENV = "development";
    let conf = require(devConfigPath);
    //console.log(conf)
    return conf;
  }
  return require(prodConfigPath);
}
