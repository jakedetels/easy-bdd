/* global blanket */

import Events from '../Events';

Events.attachListeners({
  beforeFeatures: function() {
    blanket.setupCoverage();
  },
  beforeFeature: function() {
    blanket.onModuleStart();
  },
  beforeScenario: function() {
    blanket.onTestStart();
  },
  afterScenario: function(scenario) {
    blanket.onTestDone(1, scenario.result.status === 'passed');
  },
  afterFeatures: function() {
    if (window._$blanket) {
      let sorted = {};
      Object.keys(window._$blanket).sort().forEach(function(name) {
        sorted[name] = window._$blanket[name];
      });
      window._$blanket = sorted;
    }
    
    blanket.onTestsDone();
  }
});