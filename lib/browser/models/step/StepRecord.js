import BDD from 'BDD';

export default StepRecord;

function StepRecord(defintion) {
  this.prefix = defintion.prefix;
  this.type = defintion.type;
  this.name = defintion.name;
  this.tags = [];
}

StepRecord.prototype.init = function init(world) {
  this.world = world;

  var stepFunction = world._getStepFunction(this);

  this.stepFunction = stepFunction ? stepFunction : 'missing';

  return this;
};

StepRecord.prototype.initializeTesting = function() {
  this.result = {
    log         : [],
    error      : null,
    assertions  : [],
    passed      : false,
    status      : 'passed'
  };
};

StepRecord.prototype.run = function runStep(exampleData) {
  this.initializeTesting();

  var calledCallback = false;
  var delay = this.stepFunction.wait || BDD.CONFIGS.promiseTimeout;
  var promise = BDD.utils.promises.create('Step promise failed to resolve within ' + delay + 'ms', delay + 1);
  var noCallbackTimer;

  var _callback = BDD._.once( (error) => {
    clearTimeout(noCallbackTimer);
    calledCallback = true;

    this.log(this.stepFunction.assertions);
    
    if (error) {
      this.log(error);
    }

    if (this.type === 'Then' && ! this.result.error && ! this.result.assertions.length) {
      var thenError = new Error('"Then" step definitions must contain at least one assertion.');
      thenError.stack = '';
      this.log(thenError);
    }
    
    if (this.result.error) {
      promise.reject(error);
    } else {
      this.result.passed = true;
      this.result.status = 'passed';
      promise.resolve();
    }
  });

  var failCallback = BDD._.once( (response) => {
    clearTimeout(noCallbackTimer);
    this.result.status = 'failed';
    this.log(response);
    if (promise.state() === 'pending') {
      promise.reject(response);
    }
  });

  promise.fail(failCallback);

  BDD.activeStep = this;

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

  BDD.activeStepPromise = new BDD.$.Deferred();
  BDD.activeStepPromise.fail(onStepError);
  promise.always(function() {
    BDD.activeStepPromise = null;
  });
  
  setTimeout(()=> {
    BDD.utils.tryCatch( () => {
      var argsObject = this.stepFunction.getArgumentsObject(this);

      BDD._.extend(argsObject, exampleData, {
        'done|callback': _callback
      });

      if (this.table) {
        argsObject._extras = [this.table];
      }
      
      var response = BDD.utils.callWith(this.world, this.stepFunction.fn, argsObject);

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
  this.result.missing = true;
  this.result.status = 'missing';
  this.log('MISSING STEP FUNCTION');
};

StepRecord.prototype.skip = function skipStep() {
  if (this.stepFunction === 'missing') {
    this.logMissing();
  } else {
    this.initializeTesting();
    this.result.status = 'skipped';
    this.log('SKIPPED STEP');
  }
};

StepRecord.prototype.log = function logTestResult(entry) {
  if (! entry) { return; }
  if (entry instanceof Error) {
    if (console.error && entry.stack) {
      console.error(entry.stack);
    }

    this.result.error = entry;
    this.result.status = 'failed';
    this.result.passed = false;
  }

  this.result.log = this.result.log.concat(entry);
};

StepRecord.prototype.addAssertion = function addAssertion(assertion) {
  this.result.assertions.push(assertion);
};

StepRecord.prototype.generateDefinition = function generateDefinition() {
  var description = this.name.replace(/'/g, '\\\'');
  return 'this.' + this.type + '(\'' + description + '\', function() {});';
};