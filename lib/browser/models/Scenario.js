import $ from 'jquery';
import RSVP from 'RSVP';
import _ from 'underscore';
import Events from '../Events';
import filter from '../Filter';
import Test from './Test';
import eachSeries from '../utils/each-series';

export default Scenario;

function Scenario(feature, options) {
  _.extend(this, options);

  this.feature        = feature;
  this.World          = feature.World;
  this.steps          = [];
  this.given          = [];
  this.when           = [];
  this.then           = [];
  this.tests          = [];
  this.examples       = [];
  this.elapsedTime    = 0;

  this.result = {
    status: 'passed',
    elapsedTime: 0,
    assertions: 0,
    passed: 0,
    failed: 0,
    total: 0
  };
}

var fn = Scenario.prototype;

fn.applyFilters = function() {
  this.exclude = this.feature.exclude || filter.shouldFilterOut('scenario', this);
};

// fn.run = function runScenario() {
//   Events.trigger('beforeScenario', this);
  
//   var promise = new $.Deferred();

//   if ( ! this.examples.length) {
//     this.tests.push( new Test(this) );
//   } else {
//     this.examples.forEach( example => {
//       this.tests.push( new Test(this, example) );
//     });
//   }

//   eachSeries(this.tests, (test, callback) => {
//     test.run().always(callback);
//   }).then( () => {

//     this.tests.forEach( test => {

//      if (test.result.passed) {
//         this.result.passed++;
//       } else {
//         this.result.status = test.result.status;
//         this.result.failed++;
//       }
//       this.result.error = test.result.error;
//       this.elapsedTime += test.result.elapsedTime;
//       this.result.elapsedTime += test.result.elapsedTime;
//       this.result.assertions += test.result.assertions;
//       this.result.total++;
//     });
//     Events.trigger('afterScenario', this);
//     promise.resolve();
//   });

//   return promise;
// };


fn._x_run = function runScenario() {
  Events.trigger('beforeScenario', this);
  
  var deferred = RSVP.defer();

  if ( ! this.examples.length) {
    this.tests.push( new Test(this) );
  } else {
    this.examples.forEach( example => {
      this.tests.push( new Test(this, example) );
    });
  }

  eachSeries(this.tests, (test, callback) => {
    test.run().always(callback);
  }).then( () => {

    this.tests.forEach( test => {

     if (test.result.passed) {
        this.result.passed++;
      } else {
        this.result.status = test.result.status;
        this.result.failed++;
      }
      this.result.error = test.result.error;
      this.elapsedTime += test.result.elapsedTime;
      this.result.elapsedTime += test.result.elapsedTime;
      this.result.assertions += test.result.assertions;
      this.result.total++;
    });
    Events.trigger('afterScenario', this);
    deferred.resolve();
  });

  return deferred.promise;
};

fn.run = function runScenario() {
  Events.trigger('beforeScenario', this);
  
  if ( ! this.examples.length) {
    this.tests.push( new Test(this) );
  } else {
    this.examples.forEach( example => {
      this.tests.push( new Test(this, example) );
    });
  }

  return new RSVP.Promise(resolve => {
    eachSeries(this.tests, (test, callback) => {
      test.run().always(callback);
    }).then(this.afterTests.bind(this)).then(resolve);
  });
};

fn.afterTests = function() {
  this.tests.forEach( test => {

   if (test.result.passed) {
      this.result.passed++;
    } else {
      this.result.status = test.result.status;
      this.result.failed++;
    }
    this.result.error = test.result.error;
    this.elapsedTime += test.result.elapsedTime;
    this.result.elapsedTime += test.result.elapsedTime;
    this.result.assertions += test.result.assertions;
    this.result.total++;
  });

  Events.trigger('afterScenario', this);
};

fn.generateMissingStepDefinitions = function generateMissingStepDefinitions() {
  var definitions = [];
  
  this.steps.forEach(function(step) {
    if (step.result.status === 'missing') {
      definitions.push(step.generateDefinition());
    }
  });

  return definitions.join('\n');
};
