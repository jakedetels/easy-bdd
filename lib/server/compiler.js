var EOL           = require('os').EOL;
var renameFiles   = require('broccoli-rename-files');
var Funnel        = require('broccoli-funnel');
var mergeTrees    = require('broccoli-merge-trees');
var babel         = require('broccoli-babel-transpiler');
var concatFiles   = require('broccoli-sourcemap-concat');
var ExportText    = require('broccoli-export-text');
var path          = require('path');

var easyBddTree = require('../../Brocfile');

module.exports = compiler;

function compiler(tree, options) {
  options = options || {};

  var featureTree = new Funnel(tree, {
    include: [/\.feature$/i],
    destDir: '/'
  });

  featureTree = new ExportText(featureTree, {extensions: 'feature'});

  featureTree = renameFiles(featureTree, {
    append: '-feature'
  });

  var testsTree = new Funnel(mergeTrees([tree, featureTree]), {
    exclude: options.supportFiles || []
  });

  var moduleType = options.modules || 'amd';

  testsTree = babel(testsTree, {
    blacklist: ['useStrict'],
    modules: moduleType,
    moduleIds: true,
    moduleRoot: options.moduleRoot || 'tests'
  });
 
  var testSupportJs = [];

  var moduleLoaders = {
    amd: 'loader.js/loader.js'
  };

  if (options.moduleLoader) {
    var loader = moduleLoaders[moduleType];
    if (loader) {
      testSupportJs.push(loader);
    } else {
      throw new Error('easyBdd does not have support for including a module loader for "' + moduleType + '".');
    }
  }

  var inputFiles = [];
  if (testSupportJs.length) {

    testSupportJs = concatFiles(path.join(__dirname, '../../bower_components'), {
      inputFiles: testSupportJs,
      outputFile: 'support.js'
    });

    inputFiles.push('support.js');

    testsTree = mergeTrees([testsTree, testSupportJs]);
  }

  testsTree = concatFiles(testsTree, {
    inputFiles: inputFiles.concat([
      '**/*.js'
    ]),
    outputFile: '/tests.js',
    separator: EOL + EOL,
    description: 'bdd tests'
  });

  var testemJs = new Funnel(path.join(__dirname, '../browser/testem'), {
    include: ['testem.js'],
    destDir: '/'
  });



  var trees = [easyBddTree, testsTree, testemJs];

  var supportFiles = [];

  if (options.testPage) {
    supportFiles.push(options.testPage);
  } else {
    var runnerTree = new Funnel(path.join(__dirname, '../browser'), {
      include: [
        'index.html',
        'easyBdd.css'
      ],
      destDir: '/tests'
    });

    trees.push(runnerTree);
  }

  if (options.supportFiles) {
    supportFiles = supportFiles.concat(options.supportFiles);
  }

  if (supportFiles.length) {
    var testSupportTree = new Funnel(tree, {
      include: supportFiles,
      destDir: '/tests'
    });
    trees.push(testSupportTree);
  }

  var easyBddCss = new Funnel(path.join(__dirname, '../browser'), {
    include: ['easyBdd.css'],
    destDir: '/tests'
  });

  trees.push(easyBddCss);

  tree = mergeTrees(trees);

  return tree;
}