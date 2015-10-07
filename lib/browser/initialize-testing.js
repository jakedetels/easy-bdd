import BDD from 'BDD';

export default function initialize_testing() {

  loadChai();

  BDD.tree.init();
  
  BDD.tests = {
    currentStep: null
  };

  var features = [];

  (function extractFeatures(tree) {
    features = features.concat(tree.features);
    tree.featureTrees.forEach(extractFeatures);
  })(BDD.tree);

  var promise = new BDD.$.Deferred();

  BDD.Feature.run(features).then(function() {
    restoreAssertions();
    promise.resolve();
  }).fail(function() {
    debugger;
    promise.reject();
  });

  return promise;
}

function loadChai() {
  var assert = BDD.chai.assert;
  var expect = BDD.chai.expect;

  var newAssert = wrapMethod(assert);
  var newExpect = wrapMethod(expect);

  wrap(assert, newAssert);
  wrap(expect, newExpect);

  function wrap(originalClass, newClass) {
    Object.keys(originalClass).forEach( key => {
      let value = originalClass[key];
      if (typeof value !== 'function') { return; }
      newClass[key] = wrapMethod(value);
    });
  }

  BDD.assert = newAssert;
  BDD.expect = newExpect;

  // chai.should is not exposed as a global for the same reasons described here:
  // https://github.com/switchfly/ember-cli-mocha/issues/37#issuecomment-75460873
  // window['should'] = wrapMethod('should');
  
  // BDD.chai.config.includeStack = true; 
}

function wrapMethod(fn) {
  return function() {
   var currentStep = BDD.tests.currentStep;
    if (! currentStep) {
      throw new Error('Assertions cannot be run outside of a scenario step.');
    }

    try  {
      var assertion = fn.apply(BDD.chai, arguments);
      currentStep.addAssertion(assertion);
      return assertion; 
    } catch(e) {
      currentStep.log(e);
    }
  };
}

var originalAssert = window.assert;
var originalExpect = window.expect;

function restoreAssertions() {
  window.assert = originalAssert;
  window.expect = originalExpect;
}