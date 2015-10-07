var fs = require('fs-extra');
var path = require('path');
var package = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
var easyBdd = require(path.join(__dirname, package.main));

fs.copySync('./Brocfile.js', './Brocfile-tmp.js', {clobber: true});

easyBdd({
  appFiles: [
    'easy-bdd-test.js'
  ],
  modules: 'amd',
  moduleRoot: 'tests',
  moduleLoader: true,
  Brocfile: './Brocfile-tmp.js'
});

fs.removeSync('./Brocfile-tmp.js');