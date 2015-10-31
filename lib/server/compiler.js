var EOL           = require('os').EOL;
var renameFiles   = require('broccoli-rename-files');
var Funnel        = require('broccoli-funnel');
var mergeTrees    = require('broccoli-merge-trees');
var babel         = require('broccoli-babel-transpiler');
var concatFiles   = require('broccoli-sourcemap-concat');
var ExportText    = require('broccoli-export-text');
var stringReplace = require('broccoli-string-replace');
var path          = require('path');
var fs            = require('fs');

var args          = require('./args');

var obeyTree;

if (args.dynamic) {
  process.env.obey_env = 'production';
  obeyTree = require('../../Brocfile');
} else {
  obeyTree = path.join(__dirname, '../../dist');
}

module.exports = compiler;

function compiler(options) {
  options = options || {};

  var testsDirectory = options.testsDirectory || 'tests';
  var tree = testsDirectory;

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

  var babelOptions = {
    blacklist: ['useStrict'],
    modules: moduleType,
    moduleIds: true,
    moduleRoot: options.testsModuleRoot || 'tests',
    loose: ['es6.modules']
  };

  if (options.babelSourceMaps) {
    babelOptions.sourceMaps = 'inline';
  }

  
  testsTree = babel(testsTree, babelOptions);
  
  var testSupportJs = [];

  var moduleLoaders = {
    amd: 'loader.js/loader.js'
  };

  if (options.moduleLoader) {
    var loader = moduleLoaders[moduleType];
    if (loader) {
      testSupportJs.push(loader);
    } else {
      throw new Error('obey does not have support for including a module loader for "' + moduleType + '".');
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
    description: 'obey tests'
  });

  var testemJs = new Funnel(path.join(__dirname, '../browser/testem'), {
    include: ['testem.js'],
    destDir: '/'
  });

  var trees = [obeyTree, testsTree, testemJs];

  var supportFiles = [];
  var runnerPath = path.join(__dirname, '../runner');

  if (options.testPage) {
    supportFiles.push(options.testPage);
  } else {
    var files = options.appFiles || [];
    files = files.map(function(src) {
      return '<script src="' + src + '"></script>';
    });

    var testHead, testBody;

    if (options.testHead) {
      testHead = fs.readFileSync(path.join(testsDirectory, options.testHead), 'utf8');
    }

    if (options.testBody) {
      testBody = fs.readFileSync(path.join(testsDirectory, options.testBody), 'utf8');
    }

    var runnerHtml = stringReplace(runnerPath, {
      files: ['tests.html'],
      patterns: [
        {
          match: '{{app.js}}',
          replacement: files.join('\n')
        },
        {
          match: '{{test-head}}',
          replacement: testHead || ''
        },
        {
          match: '{{test-body}}',
          replacement: testBody || ''
        },
        {
          match: '{{appModuleRoot}}',
          replacement: options.appModuleRoot || 'app'
        }
      ]
    });

    runnerHtml = new Funnel(runnerHtml, {
      include: ['tests.html'],
      destDir: '/'
    });

    trees.push(runnerHtml);
  }

  var runnerSupportJs = new Funnel(runnerPath, {
    include: ['**/*.js'],
    destDir: 'runner-support/'
  });

  trees.push(runnerSupportJs);

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

  tree = mergeTrees(trees);

  return tree;
}