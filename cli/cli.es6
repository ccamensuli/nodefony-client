const path = require('path');
const Package = require(path.resolve('package.json'));
module.exports = Package;

return process.stdout.write(Package.version);
