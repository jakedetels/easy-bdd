import BDD from 'BDD';
import _ from 'underscore';
import Events from '../../Events';
import filter from '../../Filter';

export default Scenario;

function Scenario(World, options) {
  _.extend(this, options);

  this.World          = World;
  this.steps          = [];
  this.given          = [];
  this.when           = [];
  this.then           = [];
  this.examples       = [];
  this.elapsedTime    = 0;
  this.tests          = {};

  this.filtered = filter.shouldFilterOut('scenario', this);
}

var fn = Scenario.prototype;

fn.run = function runScenario() {
  Events.trigger('beforeScenario');
  
  var promise = new BDD.$.Deferred();

  if (this.skip || this.given.length === 0) {
    this.tests.passed = false;
    this.tests.status = this.skip ? 'skipped' : 'pending';
    this.elapsedTime = 'skipped';
    promise.reject();
  } else {
    this.tests.passed = true;
    this.tests.status = 'passed';
    
    if (this.examples.length) {
      this.runExamples().then(promise.resolve);
    } else {
      this.runSteps().then(promise.resolve);  
    }
  }

  var scenario = this;
  promise.always(function() {
    scenario.result = scenario.tests;
    Events.trigger('afterScenario', scenario);
  });

  return promise;
};

fn.runExamples = function() {
  var promise = new BDD.$.Deferred();

  BDD.utils.eachSeries(this.examples, (example, callback) => {
    this.activeExample = example;
    this.runSteps(example).then(callback);
  }).then(promise.resolve);

  return promise;
};

fn.runSteps = function(example) {
  var promise = new BDD.$.Deferred();
  var startTime = Date.now();

  var world = new this.World();

  world._init(this).then( () => {
    this.steps.forEach( step => {
      step.init(world);
    });

    BDD.utils.eachSeries(this.steps, (step, callback) => {
      this.runStep(step, example).always(callback);
    }).then( () => {
      BDD.activeTest = null;
      this.elapsedTime = Date.now() - startTime;
      world._destroy().then(promise.resolve);      
    });

  });

  return promise;
};

fn.runStep = function(step, example) {
  var promise = new BDD.$.Deferred();
  var tests = example ? example.test : this.tests;

  this.lastStep = step;
  BDD.activeTest = null;

  if (! tests.passed) {
    step.skip();
    promise.resolve();
  } else if (step.fn === 'missing') {
    this.fail('missing');
    step.logMissing();
    promise.resolve();
  } else {
    step.run(example)
        .fail(this.fail.bind(this))
        .always(promise.resolve);
  }

  return promise;
};

fn.fail = function failScenario(status) {
  
  this.failTest(status, this.tests);
  if (this.activeExample) {
    this.failTest(status, this.activeExample.test);
  }

  this.steps.forEach( step => {
    if ( ! step.tests) { step.skip(); }
  });
};

fn.failTest = function(status, tests) {
  tests.passed = false;
  tests.status = typeof status === 'string' ? status : 'failed';
  tests.failedStep = this.lastStep;
};

fn.generateMissingStepDefinitions = function generateMissingStepDefinitions() {
  var definitions = [];
  
  this.steps.forEach(function(step) {
    if (step.tests.status === 'missing') {
      definitions.push(step.generateDefinition());
    }
  });

  return definitions.join('\n');
};