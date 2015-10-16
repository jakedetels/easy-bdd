import BDD from 'BDD';
import chai from 'chai';

export var assert = wrapMethod(chai.assert);
export var expect = wrapMethod(chai.expect);

wrap(chai.assert, assert);
wrap(chai.expect, expect);

function wrap(originalClass, newClass) {
  Object.keys(originalClass).forEach( key => {
    let value = originalClass[key];
    if (typeof value !== 'function') { return; }
    newClass[key] = wrapMethod(value);
  });
}

// chai.should is not exposed as a global for the same reasons described here:
// https://github.com/switchfly/ember-cli-mocha/issues/37#issuecomment-75460873
// window['should'] = wrapMethod('should');

// BDD.chai.config.includeStack = true; 

function wrapMethod(fn) {
  return function() {
   var step = BDD.activeStep;

    if (! step) {
      throw new Error('Assertions cannot be run outside of a scenario step.');
    }

    var assertion = fn.apply(chai, arguments);
    step.result.assertions.push(assertion);
    return assertion; 
  };
}