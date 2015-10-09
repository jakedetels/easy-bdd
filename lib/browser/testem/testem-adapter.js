/* global Testem */

import Events from '../Events';

var results = {
    failed: 0,
    passed: 0,
    total: 0,
    tests: []
};

var adapter = {};

Testem.useCustomAdapter(function cucumberTestemAdapter(socket) {
  adapter.socket = socket;

  Events.attachListeners({
    afterScenario: emitScenarioResults
  });

});

adapter.start = function() {
  adapter.socket.emit("tests-start");
};

adapter.end = function() {
  adapter.socket.emit("all-test-results", results);
};

var uid = 0;

function emitScenarioResults(scenario) {
  var status = scenario.result.status;
  var passed = status === 'passed' ? 1 : 0;
  var failed = status === 'failed' ? 1 : 0;
  var result = {
      passed: passed,
      failed: passed ? 0 : 1,
      total: 1,
      id: ++ uid,
      name: 'Scenario: ' + scenario.name,
      items: []
  };

  results.passed += passed;
  results.failed += failed;
  results.total++;

  if (failed) {
    
    // let failedStep = scenario.failedStep;
    let failedStep = scenario.tests.failedStep;
    let error = scenario.result.error;
    let error_message = '';

    if (error) {
      let stackLines = scenario.result.error.stack.split(/\n|\r|\n\r/);
      stackLines.splice(10, 1000);
      error_message = stackLines.join('\n');
    }
    
    result.items.push({
      passed: 0,
      message: 'Failed at: "' + failedStep.prefix + ' ' + failedStep.name + '"',
      stack: error_message
    });
  }

  results.tests.push(result);

  adapter.socket.emit("test-result", result);
}

export default adapter;