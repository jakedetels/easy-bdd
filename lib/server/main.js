var Testem    = require('testem');
var broccoli  = require('broccoli');
var Watcher   = require('broccoli-sane-watcher');
var quickTemp = require('quick-temp');
var fs        = require('fs-extra');

var compiler  = require('./compiler');
var Builder   = require('./builder');

var args = require('./args');

module.exports = function(testsTree, options) {

  var tree = compiler(testsTree, options);

  var outputPath = quickTemp.makeOrRemake({}, 'tmpDestDir');

  var builder = new Builder(tree, outputPath);

  var watcher = new Watcher(builder, {
    verbose: false,
    poll: false,
    watchman: false,
    node: true
  });

  // Only create a 2nd local server with broccoli if the broccoli parameter is passed (e.g., npm test broccoli)
  if (args.broccoli) {
    broccoli.server.serve(builder.builder, {
      watcher: watcher,
      port: 4200,
      host: 'localhost',
      'live-reload-port': 35729
    });
  }

  var testem = new Testem();
  var started = false;

  var testemOptions = JSON.parse(fs.readFileSync('./testem.json', 'utf8'));

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
    console.log('Press `Ctrl + C` to exit process.');
  }

};
