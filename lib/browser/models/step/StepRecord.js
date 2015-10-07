import BDD from 'BDD';

export default StepRecord;

function StepRecord(defintion) {
  this.prefix = defintion.prefix;
  this.type = defintion.type;
  this.name = defintion.name;
  this.tags = [];
  // this.tests = {
  //   log         : [],
  //   errors      : [],
  //   assertions  : [],
  //   passed      : false,
  //   status      : ''
  // };
}

StepRecord.prototype.init = function init(world) {
    var stepFunction = world._getStepFunction(this);

    if (stepFunction) {
      var args = stepFunction.extractArguments(this);
      var fn = stepFunction.fn;
      fn = BDD.bind(fn, world, args);
      this.fn = fn;
      this.stepFunction = stepFunction;
    } else {
      this.fn = 'missing';
    }

    return this;
};

StepRecord.prototype.initializeTesting = function() {
  this.tests = {
    log         : [],
    errors      : [],
    assertions  : [],
    passed      : false,
    status      : ''
  };
};

StepRecord.prototype.run = function runStep() {
  var calledCallback = false;
  var delay = this.stepFunction.wait || BDD.CONFIGS.promiseTimeout;
  var promise = BDD.utils.promises.create('Step promise failed to resolve within ' + delay + 'ms', delay + 1);
  var noCallbackTimer;

  this.initializeTesting();

  var _callback = BDD._.once( (error) => {
    clearTimeout(noCallbackTimer);
    calledCallback = true;

    this.log(this.stepFunction.assertions);
    
    if (error) {
      this.log(error);
    }

    if (this.type === 'Then' && ! this.tests.errors.length && ! this.tests.assertions.length) {
      var thenError = new Error('"Then" step definitions must contain at least one assertion.');
      thenError.stack = '';
      this.log(thenError);
    }
    
    if (this.tests.errors.length) {
      promise.reject(error);
    } else {
      this.tests.passed = true;
      this.tests.status = 'passed';
      promise.resolve();
    }
  });

  var failCallback = BDD._.once( (response) => {
    clearTimeout(noCallbackTimer);
    this.tests.status = 'failed';
    this.log(response);
    if (promise.state() === 'pending') {
      promise.reject();
    }
  });

  promise.fail(failCallback);

  BDD.tests.currentStep = this;

  var self = this;

  function onStepError(e) {
    let error = new Error();
    error.name = e.name;
    error.message = BDD.utils.htmlEscape(e.message);
    error.stack = e.stack;
    error.stackArray = BDD.utils.printStack(e);
    self.log(error);
    failCallback();
  }
  
  setTimeout(()=> {
    BDD.utils.tryCatch( () => {
      var response;
      if (this.stepFunction.isAsync) {
        response = this.fn(_callback);
      } else {
        response = this.fn();
      }

      var didReturnPromise = BDD.utils.promises.isPromise(response);

      if (! calledCallback && (didReturnPromise || this.stepFunction.isAsync)) { 
        noCallbackTimer = setTimeout( () => {
          failCallback('Step function promise did not resolve within ' + delay + 'ms');
        }, delay);
        
        if (didReturnPromise) {
          response.then(_callback, failCallback);
        }

      } else {
        _callback();
      }

    }, onStepError);
  });

  if (BDD.queryParams.notrycatch) {
    setTimeout( () => {
      if (BDD.utils.tryCatch.justThrewError) {
        onStepError(BDD.utils.tryCatch.uncaughtError);
      }
    });
  }

  return promise;
};

StepRecord.prototype.logMissing = function logMissingStep() {
  this.initializeTesting();
  this.tests.missing = true;
  this.tests.status = 'missing';
  this.log('MISSING STEP FUNCTION');
};

StepRecord.prototype.skip = function skipStep() {
  if (this.fn === 'missing') {
    this.logMissing();
  } else {
    this.initializeTesting();
    this.tests.status = 'skipped';
    this.log('SKIPPED STEP');
  }
};

StepRecord.prototype.log = function logTestResult(entry) {
  if (entry instanceof Error) {
    if (console.error && entry.stack) {
      console.error(entry.stack);
    }
    this.tests.errors.push(entry);
    this.tests.status = 'failed';
    this.tests.passed = false;
  }
  this.tests.log = this.tests.log.concat(entry);
};

StepRecord.prototype.addAssertion = function addAssertion(assertion) {
  this.tests.assertions.push(assertion);
};

StepRecord.prototype.generateDefinition = function generateDefinition() {
  var description = this.name.replace(/'/g, '\\\'');
  return 'this.' + this.type + '(\'' + description + '\', function() {});';
};