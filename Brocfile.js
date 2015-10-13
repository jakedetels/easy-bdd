/* jshint node:true, laxbreak:true */
var ENVIRONMENT = (process.env.easy_bdd_env || 'development').trim(); // [ test | development | production]

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
    destDir: ENVIRONMENT === 'test' ? 'app' : 'bdd'
});

var babelOptions = {
  blacklist: ['useStrict'],
  modules: 'amd',
  moduleIds: true,
  loose: ['es6.modules']
};

appJs = babel(appJs, babelOptions);

var bowerModificationsTree = __dirname + '/bower_modifications';
var bower = mergeTrees([__dirname + '/bower_components', bowerModificationsTree]);

var vendorFiles = [
  'loader.js/loader.js',
  'loader-amd-support.js',
  'jquery/dist/jquery.js',
  'jquery-no-conflict.js',
  'chai/chai.js',
  'underscore/underscore.js',
  'sinon/index.js',
  'blanket/dist/qunit/blanket.js'
];


if (ENVIRONMENT === 'test') {
  vendorFiles.splice(1, 0, 'loader-globalize.js');
}

var vendor  = concatFiles(bower, {
  inputFiles: vendorFiles,
  outputFile: '/vendor.js',
  separator: ';' + EOL,
  description: 'Concat: All my application JS'
});

appJs = concatFiles(appJs, {
  inputFiles: ['**/*.js'],
  outputFile: '/application.js',
  separator: EOL + EOL,
  description: 'Concat: All my application JS'
});

var header = 
    '\n/** Easy BDD - A behaviorially-driven development framework **/'
  + '\n\n(function() {\n';

var footer = '\n\n})();\n';

var trees = [appJs, vendor];
var inputFiles = [
    'vendor.js',
    'application.js'
  ];

if (ENVIRONMENT !== 'test') {
  footer = '\nrequire("bdd/index");' + footer;
}

appJs = concatFiles(mergeTrees(trees), {
  inputFiles: inputFiles,
  outputFile: ENVIRONMENT === 'test' ? 'easy-bdd-test.js' : 'easy-bdd.js',
  separator: EOL,
  header: header,
  footer: "\ndefine('BDD', [], function() { return {}; });\n" + footer
});

module.exports = mergeTrees([appJs, styles]);