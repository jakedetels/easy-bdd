import BDD from 'BDD';
import _ from 'underscore';
import Events from '../../Events';
import filter from '../../Filter';

export default Scenario;

function Scenario(World, options) {
  _.extend(this, options);

  this.World          = World;
  // this.name           = '';
  this.steps          = [];
  this.given          = [];
  this.when           = [];
  this.then           = [];
  this.examples       = [];
  // this.skip           = false;
  this.elapsedTime    = 0;
  this.tests          = {};
  // this.tags           = [];

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
    this.runSteps(promise);
  }

  var scenario = this;
  promise.always(function() {
    scenario.result = scenario.tests;
    Events.trigger('afterScenario', scenario);
  });

  return promise;
};

fn.runSteps = function(promise) {
  
  var startTime = Date.now();

  var world = new this.World();

  world._init().then( () => {
    this.steps.forEach( step => {
      step.init(world);
    });

    BDD.utils.eachSeries(this.steps, this.runStep.bind(this), () => {
      BDD.tests.currentStep = null;
      this.elapsedTime = Date.now() - startTime;
      world._destroy().then(promise.resolve);
    });
  });
};

fn.runStep = function(step, callback) {
  this.lastStep = step;
  BDD.tests.currentStep = null;
  if (! this.tests.passed) {
    step.skip();
    callback();
  } else if (step.fn === 'missing') {
    this.fail('missing');
    step.logMissing();
    callback();
  } else {
    step.run()
        .fail(this.fail.bind(this))
        // .fail( () => {
        //   this.fail('failed', step);
        // })
        .always(callback);
  }
};

fn.fail = function failScenario(status) {
  this.tests.passed = false;
  this.tests.status = status || 'failed';
  this.failedStep = this.lastStep;
  if (status !== 'missing') {
    this.tests.error = this.failedStep.tests.errors[0];  
  }
  
  this.steps.forEach( (step) => {
    if ( ! step.tests) { step.skip(); }
  });
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