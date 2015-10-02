var fs        = require('fs-extra');
var path      = require('path');
var broccoli  = require('broccoli');
var mergeTrees    = require('broccoli-merge-trees');
var RSVP      = require('rsvp');
var Promise   = RSVP.Promise; /* jshint ignore:line */
var remove    = RSVP.denodeify(fs.remove);
var copyDereference = require('ember-cli-copy-dereference');
var path = require('path');

module.exports = Builder;

function Builder(tree, outputPath) {  
  this.outputPath = outputPath;
  this.tree = tree;
  this.builder = new broccoli.Builder(this.tree);
}

Builder.prototype.build = function() {
  return this.builder.build.apply(this.builder, arguments)
    .then(this.processBuildResult.bind(this))
    .catch(function(error) {
      console.log('A build error occurred');
      throw error;
    });
};

Builder.prototype.processBuildResult = function(results) {
  var self = this;

  return this.clearOutputPath()
    .then(function() {
      return self.copyToOutputPath(results.directory);
    })
    .then(function() {
      return results;
    });
};

/**
  This is used to ensure that the output path is emptied, but not deleted
  itself. If we simply used `remove(this.outputPath)`, any symlinks would
  now be broken. This iterates the direct children of the output path,
  and calls `remove` on each (this preserving any symlinks).
*/
Builder.prototype.clearOutputPath = function() {
  var outputPath = this.outputPath;
  if (!fs.existsSync(outputPath)) { return Promise.resolve();}

  if(!this.canDeleteOutputPath(outputPath)) {
    return Promise.reject(new Error('Using a build destination path of `' + outputPath + '` is not supported.'));
  }

  var promises = [];
  var entries = fs.readdirSync(outputPath);

  for (var i = 0, l = entries.length; i < l; i++) {
    promises.push(remove(path.join(outputPath, entries[i])));
  }

  return Promise.all(promises);
};

Builder.prototype.copyToOutputPath = function(inputPath) {
  var outputPath = this.outputPath;

  return new Promise(function(resolve) {
    if (!fs.existsSync(outputPath)) {
      fs.mkdirsSync(outputPath);
    }

    resolve(copyDereference.sync(inputPath, outputPath));
  });
};

Builder.prototype.canDeleteOutputPath = function() {
  console.log('@todo: update Builder.prototype.canDeleteOutputPath');
  // return this.project.root.indexOf(this.outputPath) === -1;
  return true;
};