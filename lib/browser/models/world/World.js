import BDD from 'BDD';

export default World;

function World() {}

World.prototype = {
  
  constructor: World,

  _init: function(scenario) {
    this.activeScenario = scenario;
    return this._invokeHooks('before');
  },

  _beforeEach: function(callback) { callback(); },
  
  _afterEach: function(callback) { callback(); },
  
  _destroy: function() {
    return this._invokeHooks('after');
  },

  _invokeHooks: function(hook) {
    var promise = new BDD.$.Deferred();

    var hooks = getTaggedHooks(this.activeScenario.tags, this[hook + 'Tags']);
    var eachFnName = '_' + hook + 'Each';

    hooks.unshift(this[eachFnName]);

    var self = this;
    BDD.utils.eachSeries(hooks, function(fn, callback) {

      BDD.utils.callWith(self, fn, {
        parent: self._parentWorld[eachFnName],
        'done|callback': callback
      });

      if (! fn.isAsync) { callback(); }
        
    }, promise.resolve);


    return promise;
  },
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

World._x_create = function create(options, stepFunctions, ParentWorld) {
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

World.create = function create(prototype, stepFunctions, ParentWorld) {

  var constructor = prototype.constructor = ( prototype._constructor || function() {} );
  var proto;

  if (ParentWorld) {
    proto = prototype._parentWorld = new ParentWorld();
  } else {
    proto = new World();
  }
  
  prototype = BDD._.extend({}, proto, prototype);

  prototype._stepFunctions = stepFunctions;
  
  constructor.prototype = prototype;

  if (prototype.beforeEach) {
    if (typeof prototype.beforeEach !== 'function') {
      throw new Error('beforeEach must be a function');
    }
    
    prototype.beforeEach.isAsync = BDD.utils.isAsync(prototype.beforeEach);
    
    prototype._beforeEach = prototype.beforeEach;
  }

  if (prototype.afterEach) {
    if (typeof prototype.afterEach !== 'function') {
      throw new Error('afterEach must be a function');
    }

    prototype.afterEach.isAsync = BDD.utils.isAsync(prototype.afterEach);

    prototype._afterEach = prototype.afterEach;
  }

  return constructor;
};

function getTaggedHooks(tags, fns) {
  if (! tags.length || ! fns.length) { return []; }

  var matchedFns = [];

  fns.forEach(function(item) {    
    for (var i = 0; i < item.tags.length; i++) {
      var tag = item.tags[i];
      tag = tag.split(/,\s*/);
      if (tag.length === 1) {
        if (tags.indexOf(tag[0]) === -1) { return; }  
      } else {
        if (! BDD._.intersection(tags, tag).length) { return; }
      }
      
    }
    matchedFns.push(item.fn);
  });

  return matchedFns;
}