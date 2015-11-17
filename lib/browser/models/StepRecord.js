import Obey from 'Obey';
import $ from 'jquery';
import _ from 'underscore';
import utils from '../utils/index';

export default StepRecord;

function StepRecord(defintion) {
  this.prefix = defintion.prefix;
  this.type = defintion.type;
  this.name = defintion.name;
  this.tags = [];
}

var fn = StepRecord.prototype;

fn.init = function init(world) {
  this.world = world;

  var stepFunction = world._getStepFunction(this);

  this.stepFunction = stepFunction ? stepFunction : 'missing';

  return this;
};

fn.run = function(exampleData) {
  this.reset();
  this.initializeTesting();

  var wait = this.stepFunction.wait || 1000;
  var delay = this.stepFunction.delay || 0;
  var promiseWait = wait + delay;
  var failCallback = _.once(this.failCallback.bind(this));

  this._promise = utils.promises.create('Step promise failed to resolve within ' + wait + 'ms', promiseWait + 1);
  this._exampleData = exampleData;
  this._calledCallback = false;
  this._callback = _.once(this.onStepComplete.bind(this));
  
  Obey.activeStep = this;
  Obey.activeStepPromise = new $.Deferred();
  Obey.activeStepPromise.fail(failCallback);

  this._promise
    .fail(failCallback)
    .always(function() {
      Obey.activeStepPromise = null;
    });
  
  setTimeout(()=> {
    utils.tryCatch(this.invokeStepFunction.bind(this), failCallback);
  }, delay);

  if (utils.queryParams('notrycatch')) {
    setTimeout( () => {
      if (utils.tryCatch.justThrewError) {
        failCallback(utils.tryCatch.uncaughtError);
      }
    });
  }

  return this._promise;
};

fn.reset = function() {
  delete this._callback;
  delete this._exampleData;
  delete this._promise;
  delete this._calledCallback;
};

fn.initializeTesting = function() {
  this.result = {
    log         : [],
    error      : null,
    assertions  : [],
    passed      : false,
    status      : 'passed'
  };
};

fn.invokeStepFunction = function() {
  utils.tryCatch.reset();

  var argsObject = this.createArgumentsObject();
  
  var response = utils.callWith(this.world, this.stepFunction.fn, argsObject);

  var didReturnPromise = utils.promises.isPromise(response);

  var wasAsync = ! this._calledCallback && (didReturnPromise || this.stepFunction.isAsync);

  if (didReturnPromise) {
    response.then(this._callback, this.failCallback);
  } else if (! wasAsync) {
    this._callback();
  }
};

fn.createArgumentsObject = function() {
  var argsObject = this.stepFunction.getArgumentsObject(this);

  _.extend(argsObject, this._exampleData, {
    'done|callback': this._callback,
    '_super': () => {
      var stepFunction = this.world._parentWorld._getStepFunction(this);
      if (stepFunction) {
        return stepFunction.fn.apply(this.world, arguments);
      }
    }
  });

  if (this.table) {
    argsObject._extras = [this.table];
  }

  return argsObject;
};

fn.onStepComplete = function(error) {
  this._calledCallback = true;

  this.log(this.stepFunction.assertions);
  
  if (error instanceof Error) {
    this.log(error);
  // } else if (utils.tryCatch.justThrewError) {
  } else if ( utils.tryCatch.wasUncaughtErrorThrown() ) {
    // this.onStepError(utils.tryCatch.uncaughtError);
    this.onStepError( utils.tryCatch.getUncaughtError() );
    return;
  }

  if (this.type === 'Then' && ! this.result.error && ! this.result.assertions.length) {
    var thenError = new Error('"Then" step definitions must contain at least one assertion.');
    thenError.stack = '';
    this.log(thenError);
  }
  
  if (this.result.error) {
    this._promise.reject(error);
  } else {
    this.result.passed = true;
    this.result.status = 'passed';
    this._promise.resolve();
  }
};

fn.onStepError = function(e) {
  var error = new Error();
  error.name = e.name;
  error.message = utils.htmlEscape(e.message);
  error.stack = e.stack;
  error.stackArray = utils.printStack(e);
  this.log(error);
  this.failCallback();
};

fn.failCallback = function(response) {
  this.result.status = 'failed';
  this.result.error = response;
  this.log(response);
  if (this._promise.state() === 'pending') {
    this._promise.reject(response);
  }
};

fn.logMissing = function logMissingStep() {
  this.initializeTesting();
  this.result.missing = true;
  this.result.status = 'missing';
  this.log('MISSING STEP FUNCTION');
};

fn.skip = function skipStep() {
  if (this.stepFunction === 'missing') {
    this.logMissing();
  } else {
    this.initializeTesting();
    this.result.status = 'skipped';
    this.log('SKIPPED STEP');
  }
};

fn.log = function logTestResult(entry) {
  if (! entry) { return; }
  if (entry instanceof Error) {
    entry.obeyHandled = true;
    if (console.error && entry.stack) {
      console.error(entry.stack);
    }

    this.result.error = entry;
    this.result.status = 'failed';
    this.result.passed = false;
  }

  this.result.log = this.result.log.concat(entry);
};

fn.addAssertion = function addAssertion(assertion) {
  this.result.assertions.push(assertion);
};

fn.generateDefinition = function generateDefinition() {
  var description = this.name.replace(/'/g, '\\\'');
  return 'this.' + this.type + '(\'' + description + '\', function() {});';
};