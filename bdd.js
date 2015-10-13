var fs = require('fs-extra');
var path = require('path');
var package = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
var easyBdd = require(path.join(__dirname, package.main));

var args = require('./lib/server/args');

var options = {
  appFiles: [
    'easy-bdd-test.js',
    'tests/loaderjs-mocks.js'
  ],
  modules: 'amd',
  moduleRoot: 'tests',
  supportFiles: [
    'loaderjs-mocks.js'
  ]
};

if (args.dynamic) {
  console.log('Running tests with **dynamic** version of Easy BDD');
  process.env.easy_bdd_env = 'test';
  options.Brocfile = './Brocfile-tmp.js';
  fs.copySync('./Brocfile.js', './Brocfile-tmp.js', {clobber: true});
} else {
  console.log('Running tests with **static** version of Easy BDD');
  process.env.easy_bdd_env = 'production';

  fs.removeSync(path.join(__dirname, 'dist'));

  var child_process = require('child_process');

  console.log('Building dist/ directory');
  child_process.execSync('broccoli build dist');

  process.env.easy_bdd_env = 'test';
}

console.log('Compiling application and test trees');

easyBdd(options);

if (args.dynamic) {
  fs.removeSync('./Brocfile-tmp.js');
}