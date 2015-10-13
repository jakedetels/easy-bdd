var Testem      = require('testem');
var broccoli    = require('broccoli');
var Watcher     = require('broccoli-sane-watcher');
var quickTemp   = require('quick-temp');
var fs          = require('fs-extra');
var path        = require('path');
var mergeTrees  = require('broccoli-merge-trees');

var Builder     = require('./builder');
var args        = require('./args');

module.exports = function(options) {

  var brocfilePath = path.join(process.cwd(), options.Brocfile || 'Brocfile.js');

  var appTree = fs.existsSync(brocfilePath)
    ? require(brocfilePath)
    : (options.appDirectory || 'app');

  var compiler    = require('./compiler');

  var testsTree = compiler(options);

  var tree = mergeTrees([appTree, testsTree], {
    overwrite: true
  });

  var outputPath = quickTemp.makeOrRemake({}, 'tmpDestDir');

  var builder = new Builder(tree, outputPath);

  var watcher = new Watcher(builder, {
    verbose: false,
    poll: false,
    watchman: false,
    node: true
  });

  // Only create a 2nd local server with broccoli if the broccoli parameter is passed (e.g., npm test broccoli)
  if (args.broccoli || args.notestem) {
    broccoli.server.serve(builder.builder, {
      watcher: watcher,
      port: 4200,
      host: 'localhost',
      'live-reload-port': 35729
    });
  }

  if (args.notestem) { return; }

  var testem = new Testem();
  var started = false;
  var testemOptions = options.testem;
  if (! testemOptions && fs.existsSync('./testem.json')) {
    testemOptions = JSON.parse(fs.readFileSync('./testem.json', 'utf8'));
  } else {
    testemOptions = {
      framework: 'custom',
      test_page: 'tests.html',
      launch_in_ci: [
        'PhantomJS'
      ],
      launch_in_dev: [
        'PhantomJS',
        'Chrome'
      ]
    };
  }

  testemOptions.port = 7357;
  testemOptions.cwd = outputPath;

  if (args.exclude || args.include) {
    
    var params = [];

    if (args.exclude) {
      params.push( 'exclude=' + args.exclude );
    }

    if (args.include) {
      params.push( 'include=' + args.include );
    }

    testemOptions.test_page += '?' + params.join('&');
  }

  watcher.on('change', function() {
    if (started) {
      testem.restart();
    } else {
      started = true;
      testem.startDev(testemOptions, onTestemQuit);
    }
  });

  function onTestemQuit() {
    fs.remove(outputPath);
    process.exit();
  }

};
