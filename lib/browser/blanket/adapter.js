/* global blanket */

import { loadUnusedModules } from './loaderjs-adapter';

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

    loadUnusedModules();

    sortObject(window._$blanket);
    
    blanket.onTestsDone();
  }
});

function sortObject(obj) {
  if (typeof obj !== 'object') { return; }
  Object.keys(obj).sort().forEach(function(name) {
    var value = obj[name];
    delete obj[name];
    obj[name] = value;
  });
}