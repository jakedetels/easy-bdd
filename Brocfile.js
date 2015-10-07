/* jshint node:true, laxbreak:true */

var babel         = require('broccoli-babel-transpiler');
var concatFiles   = require('broccoli-sourcemap-concat');
var mergeTrees    = require('broccoli-merge-trees');
var Funnel        = require('broccoli-funnel');
var BrocText      = require('broccoli-export-text');
var compileLess   = require('broccoli-less-single');

var EOL   = require('os').EOL;
var app   = __dirname + '/lib/browser';

var styles = compileLess(__dirname + '/lib/runner/styles', 'main.less', 'easy-bdd.css');

var appJs = new BrocText(app, {extensions: 'html'});

appJs = new Funnel(appJs, {
    include: ['**/*.js'],
    destDir: 'bdd'
});

appJs = babel(appJs, {
  blacklist: ['useStrict'],
  modules: 'amd',
  moduleIds: true
});

var bower = mergeTrees([__dirname + '/bower_components', __dirname + '/bower_modifications']);

var vendor  = concatFiles(bower, {
  inputFiles: [
    'loader.js/loader.js',
    'loader-amd-support.js',
    'jquery/dist/jquery.js',
    'jquery-no-conflict.js',
    'chai/chai.js',
    'underscore/underscore.js',
    'blanket/dist/qunit/blanket.js'
  ],
  outputFile: '/vendor.js',
  separator: ';' + EOL,
  description: 'Concat: All my application JS'
});

appJs = concatFiles(appJs, {
  inputFiles: ['**/*.js'],
  outputFile: '/application.js',
  separator: ';' + EOL,
  description: 'Concat: All my application JS'
});

var header = 
    '\n/** Easy BDD - A behaviorially-driven development framework **/'
  + '\n\n(function() {\n';

var footer = 
    '\nrequire("bdd/index");'
  + '\n})();';

appJs = concatFiles(mergeTrees([appJs, vendor]), {
  inputFiles: [
    'vendor.js',
    'application.js'
  ],
  outputFile: 'easy-bdd.js',
  separator: EOL,
  header: header,
  footer: footer
});

module.exports = mergeTrees([appJs, styles]);