import _ from 'underscore';
import $ from 'jquery';
import eachSeries from '../../utils/each-series';
import Events from '../../Events';
import filter from '../../Filter';
import Parser from './parser';
// import ui from '../../ui/index';
import BDD from 'BDD';

export default Feature;

function Feature(options = {}) {
  _.extend(this, options);

  this.scenarios  = [];
  
  this.tags       = [];
  this.result = {
    status: 'passed',
    passed: 0,
    failed: 0,
    total: 0,
    elapsedTime: 0
  };

  // @todo: shouldn't a file be required every time?
  if (this.file) {
    this.init();
  }

  this.exclude = filter.shouldFilterOut('feature', this);
  this.scenarios.forEach( scenario => {
    scenario.applyFilters();
  });
}

Feature.prototype.init = function init() {
  if (typeof this.file !== 'string') {
    throw new Error('Feature cannot be initialized without a feature file.');
  }

  new Parser(this);
};

Feature.prototype.run = function runFeature() {
  Events.trigger('beforeFeature');
  
  var promise = new $.Deferred();

  var iterator = (scenario, callback) => {
    if (scenario.exclude) {
      callback();
      return;
    }
    scenario.run().always(callback);
  };

  eachSeries(this.scenarios, iterator).then( () => {
    
    this.scenarios.forEach( scenario =>  {
      if (scenario.result.status === 'passed') {
        this.result.passed++;
      } else {
        this.result.status = 'failed';
        this.result.failed++;
      }
      this.result.total++;
      this.result.elapsedTime += scenario.result.elapsedTime;
    });

    promise.resolve();
  });

  var feature = this;
  promise.then(function() {
    Events.trigger('afterFeature', feature);
  });

  return promise;
};

Feature.run = function runFeatures(features) {
  Events.trigger('beforeFeatures');
  var promise = new $.Deferred();
  
  var iterator = function(feature, callback) {

    if (feature.exclude) {
      callback();
      return;
    }

    feature.run().then( () => {
      // Wrap in a timeout to prevent crashes from ui rendering errors 
      setTimeout(BDD.ui.printFeatureTestResults.bind(BDD.ui, feature), 0);
      callback();
    }).fail(function() {
      debugger; /* jshint ignore:line */
    });
  };

  eachSeries(features, iterator, promise.resolve);

  promise.then(function() {
    Events.trigger('afterFeatures');
  });

  return promise;
};
