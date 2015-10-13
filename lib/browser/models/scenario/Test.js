import BDD from 'BDD';
import $ from 'jquery';
import Events from '../../Events';
import eachSeries from '../../utils/each-series';

export default Test;

function Test(scenario, example) {
  this.scenario     = scenario;
  this.World        = scenario.feature.World;
  this.steps        = scenario.steps;
  this.skip         = scenario.skip;
  this.given        = scenario.given;
  this.tags         = scenario.tags;
  this.example      = example || {};
  
  this.result = {
    passed: true,
    status: 'passed',
    error: null,
    failedStep: null,
    elapsedTime: 0
  };

  this.example.result = this.result;
}

var fn = Test.prototype;

fn.run = function() {
  Events.trigger('beforeTest');
  
  var promise = new $.Deferred();

  if (this.skip || this.given.length === 0) {
    this.result.passed = false;
    this.result.status = this.skip ? 'skipped' : 'pending';
    this.elapsedTime = 'skipped';
    promise.reject();
    return promise;
  } 
  
  this.runSteps().always( () => {
    promise.resolve();
    Events.trigger('afterTest', this);
  });  
  
  return promise;
};

fn.runSteps = function() {
  var promise = new $.Deferred();
  
  var startTime = Date.now();

  var world = new this.World();

  world._init(this).then( () => {
    this.steps.forEach( step => {
      step.init(world);
    });

    eachSeries(this.steps, (step, callback) => {
      this.runStep(step).always( response => callback(response) );
    }).then( () => {
      BDD.activeStep = null;
      this.result.elapsedTime = Date.now() - startTime;
      world._destroy().then(promise.resolve);      
    });

  });

  return promise;
};

fn.runStep = function(step) {
  var promise = new $.Deferred();

  this.lastStep = step;
  BDD.activeStep = null;

  if (! this.result.passed) {
    step.skip();
    promise.resolve();
  } else if (step.stepFunction === 'missing') {
    this.result.passed = false;
    this.result.status = 'missing';
    this.result.failedStep = step;
    step.logMissing();
    promise.resolve();
  } else {
    step.run(this.example.data).done(promise.resolve).fail( () => {
      this.result.passed = false;
      this.result.failedStep = step;
      this.result.error = step.result.error;
      this.result.status = step.result.status;
      promise.reject();
    });
  }

  return promise;
};