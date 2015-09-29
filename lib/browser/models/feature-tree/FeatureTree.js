export default FeatureTree;

function FeatureTree(name, parent) {
  this.name         = name;
  this.parent       = parent || null;
  this.level        = (parent ? parent.level + 1 : 1);
  this.module       = (parent ? parent.module + '/' : '') + name;
  this.features     = [];
  this.featureTrees = [];
  this.files = {
    features: [],
    steps: [],
    world: null
  };
  this.stepFunctions = {
    Given: [],
    When : [],
    Then : []
  };
}

var fn = FeatureTree.prototype;

fn.constructor = FeatureTree;

fn.addToTree = function addToTree(filePath, exports, level) {
  'use strict';

  level = level || 1;

  var parts = filePath.split('/');
  var isFolder = parts.length > 1;
  
  if (isFolder) {
    let featureTreeName = parts.shift();
    let isCurrentTree = featureTreeName === this.name && level === this.level;
    let featureTree = isCurrentTree ? this : this.getFeatureTree(featureTreeName);
    filePath = parts.join('/');
    featureTree.addToTree(filePath, exports, level + 1);
  } else {
    let fileName = parts[0] || '';
    let fileType = fileName.split('-').pop();
    this.loadFile(fileType, exports);
  }
};

/**
 * Finds an existing FeatureTree from featureTrees array, or creates a new
 * FeatureTreee if none is found matching the specified name
 * @param  {String}     featureTreeName The name of the desired FeatureFile
 * @return {FeatureFle} A new or existing FeatureFile
 */
fn.getFeatureTree = function getFeatureTree (featureTreeName) {  
  var featureTree = BDD._.findWhere(this.featureTrees, {name: featureTreeName});

  if (! featureTree) {
    featureTree = new FeatureTree(featureTreeName, this);
    this.featureTrees.push(featureTree);
  }

  return featureTree;
};

fn.loadFile = function(fileType, exports) {
  switch (fileType) {
    case 'feature':
      this.files.features.push(exports);
      break;
    case 'steps':
      this.files.steps.push(exports);
      break;
    case 'world':
      if (this.files.world) {
        throw new Error('Only one world may be defined per directory.');
      }
      this.files.world = exports;
      break;
    default:
      throw new Error('Unknown file type: ' + fileType);
  }
};

FeatureTree.prototype.init = function init() {
  // var feature;

  // create World constructor to be used for each feature within
  // the featureTree
  var ParentWorld = this.parent ? this.parent.World : null;
  this.World = BDD.World.create(this.files.world, this.stepFunctions, ParentWorld);

  /*
  Load each feature onto the featureTree's features array, parsing the
  feature file for its scenarios, step descriptions, and examples
  */
  this.files.features.forEach( (file) => {
    if (! file) { return; }
    
    var feature = new BDD.Feature({
      file: file,
      World: this.World,
      module: this.name,
      parentModule: this.parent ? this.parent.module : null
    });
    // this.features[feature.name] = feature;
    this.features.push(feature);
  });

  // Load the exported functions from each step.js file in the context
  // of the featureTree.  Each Given/When/Then step function is loaded onto 
  // the featureTree object
  this.files.steps.forEach( (loadStepsFn) => {
    var argNames = BDD.utils.getArgumentNames(loadStepsFn);
    var args = [];

    var assertIndex = argNames.indexOf('assert');

    if (assertIndex > -1) {
      args[assertIndex] = BDD.assert;
    }

    var expectIndex = argNames.indexOf('expect');

    if (expectIndex > -1) {
      args[expectIndex] = BDD.expect;
    }

    loadStepsFn.apply(this, args);
  });

  // Initialize descendent featureTrees
  this.featureTrees.forEach(function(featureTree) {
    featureTree.init();
  });
};

function registerStepFunction(type, step, fn, options) {
  fn = fn || function() {};
  
  var isRegex = false,
      variableRegex = /\$\{[^\}]+\}/g,
      regex;

  if (step instanceof RegExp) {
    isRegex = true;
    regex = step;
  } else if (step.match(variableRegex)) {
    regex = new RegExp('^' + step.replace(variableRegex, '(.+)') + '$', 'i');
    isRegex = true;
  } else{
    regex = new RegExp('^' + step + '$', 'i');
  }

  var stepFunction = new BDD.StepFunction(regex, fn, options);

  this.stepFunctions[type].push(stepFunction);
}

FeatureTree.prototype.Given = function Given(step, stepFn, options) {
  registerStepFunction.apply(this, ['Given', step, stepFn, options]);
};

FeatureTree.prototype.When = function When(step, stepFn, options) {
  registerStepFunction.apply(this, ['When', step, stepFn, options]);
};

FeatureTree.prototype.Then = function Then(step, stepFn, options) {
  registerStepFunction.apply(this, ['Then', step, stepFn, options]);
};

FeatureTree.prototype.run = function runFeatureTree() {
  this.tests = {
    passed: true
  };

  this.features.forEach( (feature) => {
    feature.run(this.World);
    if (! feature.tests.passed) {
      this.tests.passed = false;
    }
  });

  this.featureTrees.forEach( (featureTree) => {
    featureTree.run();
    if (! featureTree.tests.passed) {
      this.tests.passed = false;
    }
  });

  var promise = new $.Deferred();
  // var promise = BDD.utils.promises.create();
  promise.resolve();

  return promise;
};