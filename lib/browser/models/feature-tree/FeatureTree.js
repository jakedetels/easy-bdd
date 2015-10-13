import BDD from 'BDD';

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

  this.worldPrototype = {
    beforeTags: [],
    afterTags: []
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
  // Load the exported functions from each step.js file in the context
  // of the featureTree.  Each Given/When/Then step function is loaded onto 
  // the featureTree object
  
  var stepLoaders = this.files.steps;

  if (typeof this.files.world === 'function') {
    stepLoaders = [].concat(stepLoaders).concat(this.files.world);
  }

  stepLoaders.forEach( loadStepsFn => {
    
    BDD.utils.callWith(this, loadStepsFn, {
      assert: BDD.assert,
      expect: BDD.expect,
      sinon: require('sinon')
    });

  });

  this.prepareWorld();

  // Load each feature onto the featureTree's features array, parsing the
  // feature file for its scenarios, step descriptions, and examples
  this.files.features.forEach( file => {
    if (! file) { return; }
    
    var feature = new BDD.Feature({
      file: file,
      World: this.World,
      module: this.name,
      parentModule: this.parent ? this.parent.module : null
    });
    
    this.features.push(feature);
  });

  // Initialize descendent featureTrees
  this.featureTrees.forEach(function(featureTree) {
    featureTree.init();
  });
};

function registerStepFunction(type, step, fn, options) {
  var stepFunction = new BDD.StepFunction(step, fn, options);

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

FeatureTree.prototype.World = function(fn) {
  this.worldPrototype._constructor = fn;
};

FeatureTree.prototype.Before = function(...args) {
  var fn = args.pop();
  if (args.length) {
    this.worldPrototype.beforeTags.push({
      tags: args.map( str => str.replace(/@/g, '')),
      fn: fn
    });
  } else {
    this.worldPrototype.beforeEach = fn;  
  }
  fn.isAsync = BDD.utils.isAsync(fn);
};

FeatureTree.prototype.After = function(fn) {
  this.worldPrototype.afterEach = fn;
};

FeatureTree.prototype.prepareWorld = function() {
  if (this.World !== FeatureTree.prototype.World) {
    this.worldPrototype._constructor = this.World;
  }

  var ParentWorld = this.parent ? this.parent.World : null;
  this.World = BDD.World.create(this.worldPrototype, this.stepFunctions, ParentWorld);
};