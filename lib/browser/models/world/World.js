import BDD from 'BDD';

export default World;

function World() {}

World.prototype = {
  
  constructor: World,

  _init: function() {
    var promise = new BDD.$.Deferred();

    this._beforeEach(promise.resolve);

    if (! this._beforeEach.isAsync) {
      promise.resolve();
    }

    return promise;
  },

  _beforeEach: function(callback) { callback(); },
  
  _afterEach: function(callback) { callback(); },
  
  _destroy: function() {
    var promise = new BDD.$.Deferred();

    BDD.utils.callWith(this, this._afterEach, {
      parent: this._parentWorld._afterEach,
      'done|callback': promise.resolve
    });

    if (! this._afterEach.isAsync) {
      promise.resolve();
    }

    return promise;
  }
};

World.prototype._getStepFunction = function getStepFunction(stepRecord) {
  var stepFunctions = this._stepFunctions[stepRecord.type];
  var stepFunction, match, i;

  for (i = 0; i < stepFunctions.length; i++) {
    stepFunction = stepFunctions[i];
    match = stepRecord.name.match(stepFunction.regex);
    if (match) { break; }
  }

  if (match) {
    return stepFunction;
  } else if (this._parentWorld) {
    return this._parentWorld._getStepFunction(stepRecord);
  }

};

World.create = function create(options, stepFunctions, ParentWorld) {
  var NewWorld = function ScenarioSteps() {};
  var WorldPrototype = ParentWorld || World;

  NewWorld.prototype = new WorldPrototype();
  NewWorld.prototype.constructor = NewWorld;
  NewWorld.prototype._stepFunctions = stepFunctions;
  if (ParentWorld) {
    NewWorld.prototype._parentWorld = new ParentWorld();
  }
  

  options = options || {};

  if (options.beforeEach) {
    if (typeof options.beforeEach !== 'function') {
      throw new Error('beforeEach must be a function');
    }
    
    options.beforeEach.isAsync = BDD.utils.isAsync(options.beforeEach);
    
    NewWorld.prototype._beforeEach = options.beforeEach;
  }

  if (options.afterEach) {
    if (typeof options.afterEach !== 'function') {
      throw new Error('afterEach must be a function');
    }

    options.afterEach.isAsync = BDD.utils.isAsync(options.afterEach);

    NewWorld.prototype._afterEach = options.afterEach;

    // NewWorld.prototype._afterEach.argsNames = BDD.utils.getArgumentNames(NewWorld.prototype._afterEach);
  }


  return NewWorld;
};