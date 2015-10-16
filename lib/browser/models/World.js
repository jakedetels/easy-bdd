import $ from 'jquery';
import _ from 'underscore';
import utils from '../utils/index';

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
    var promise = new $.Deferred();

    var hooks = this.getTaggedHooks(this.activeScenario.tags, hook);
    var eachFnName = '_' + hook + 'Each';

    hooks.unshift(this[eachFnName]);

    var self = this;
    utils.eachSeries(hooks, function(fn, callback) {

      utils.callWith(self, fn, {
        parent: self._parentWorld[eachFnName],
        'done|callback': callback,
        before: function() {
          self._parentWorld.beforeEach.apply(self, arguments);
        },
        after: function() {
          self._parentWorld.afterEach.apply(self, arguments);
        }
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

World.create = function create(prototype, stepFunctions, ParentWorld) {

  var constructor = prototype.constructor = ( prototype._constructor || function() {} );
  var proto;

  if (ParentWorld) {
    proto = prototype._parentWorld = new ParentWorld();
  } else {
    proto = new World();
  }
  
  prototype = _.extend({}, proto, prototype);

  prototype._stepFunctions = stepFunctions;
  prototype._super = prototype;
  
  constructor.prototype = prototype;

  if (prototype.beforeEach) {
    if (typeof prototype.beforeEach !== 'function') {
      throw new Error('beforeEach must be a function');
    }
    
    prototype.beforeEach.isAsync = utils.isAsync(prototype.beforeEach);
    
    prototype._beforeEach = prototype.beforeEach;
  }

  if (prototype.afterEach) {
    if (typeof prototype.afterEach !== 'function') {
      throw new Error('afterEach must be a function');
    }

    prototype.afterEach.isAsync = utils.isAsync(prototype.afterEach);

    prototype._afterEach = prototype.afterEach;
  }

  return constructor;
};

World.prototype.getTaggedHooks = function(tags, hookType) {
  if (! tags.length) { return []; }

  var fns = [];
  var world = this;

  while (world) {
    fns = fns.concat(world[hookType + 'Tags']);
    world = world._parentWorld;
  }

  if (! fns.length) { return []; }

  var matchedFns = [];

  fns.forEach(function(item) {    
    for (var i = 0; i < item.tags.length; i++) {
      var tag = item.tags[i];
      tag = tag.split(/,\s*/);
      if (tag.length === 1) {
        if (tags.indexOf(tag[0]) === -1) { return; }  
      } else {
        if (! _.intersection(tags, tag).length) { return; }
      }
      
    }
    matchedFns.push(item.fn);
  });

  return matchedFns;
};