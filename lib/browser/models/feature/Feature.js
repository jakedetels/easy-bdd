import filter from '../../Filter';
import Parser from './parser';

export default Feature;

function Feature(options = {}) {
  BDD._.extend(this, options);

  this.scenarios  = [];
  this.tests      = {};
  this.tags       = [];

  // @todo: shouldn't a file be required every time?
  if (this.file) {
    this.init();
  }

  this.filtered = filter.shouldFilterOut('feature', this);
}

Feature.prototype.init = function init() {
  if (typeof this.file !== 'string') {
    throw new Error('Feature cannot be initialized without a feature file.');
  }

  new Parser(this);
};

Feature.prototype.run = function runFeature() {
  var promise = new BDD.$.Deferred();

  this.tests.passed = true;
  this.tests.status = 'passed';

  var iterator = (scenario, callback) => {
    if (scenario.filtered) {
      console.debug('filtering scenario: ' + scenario.name, scenario);
      callback();
      return;
    }
    scenario.run()
      .always( () => {
        if (scenario.tests.status === 'skipped') {
          this.skipFeature();
        } else if (! scenario.tests.passed) {
          this.fail();
        }
        callback();
      });
  };

  BDD.utils.eachSeries(this.scenarios, iterator, promise.resolve);

  return promise;
};

Feature.prototype.fail = function() {
  this.tests.passed = false;
  this.tests.status = 'failed';
};

Feature.prototype.skipFeature = function() {
  this.tests.passed = false;
  this.tests.status = 'skipped';
};

Feature.run = function runFeatures(features) {

  var promise = new BDD.$.Deferred();
  
  var iterator = function(feature, callback) {

    if (feature.filtered) {
      console.debug('filtering feature: ' + feature.name, feature);
      callback();
      return;
    }

    feature.run().then( () => {
      // console.log('about to render feature: ' + feature.name);
      
      // Wrap in a timeout to prevent crashes from ui rendering errors 
      setTimeout(BDD.ui.printFeatureTestResults.bind(BDD.ui, feature), 0);
      // BDD.ui.printFeatureTestResults(feature);
      callback();
    }).fail(function() {
      debugger;
    });
  };

  BDD.utils.eachSeries(features, iterator, promise.resolve);

  return promise;
};


