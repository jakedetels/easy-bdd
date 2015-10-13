const featureFile1 = `
  @boo
  Feature: Foo

  In order to A
  As a B
  I want to C

  @foo
  Scenario: apple
    Given A
    When B
    Then C

  @bar
  Scenario: banana
    Given A
    When B
    Then C

  @baz
  Scenario: cherry
    Given A
    When B
    Then C

`;

const featureFile2 = `
  @marge
  Feature: Bar

  In order to A
  As a B
  I want to C

  @homer, @bar
  Scenario: chocolate
    Given A
    When B
    Then C

  @bart
  Scenario: vanilla
    Given A
    When B
    Then C

  @lisa, @maggie
  Scenario: cherry
    Given A
    When B
    Then C

`;

let steps = function(assert) {
  this.Given('A', function() {});
  this.When('B', function() {});
  this.Then('C', function() { assert(true); });
};

var _ = require('underscore');

export default function(expect) {

  this.World = function() {
    this.params = {};

    var self = this;

    this.processParam = function(param) {
      param = param || '';
      var include = param.match(/include=([^&$]+)/);
      if (include) {
        self.params.include = include[1];
      }
      var exclude = param.match(/exclude=([^&$]+)/);
      if (exclude) {
        self.params.exclude = exclude[1];
      }      
    };
  };

  this.Given('URL parameter <param>', function(param) {
    this.processParam(param);

    this.filter = require('app/Filter', {
      'app/utils/query-params': () => this.params 
    });
  });

  this.Given('two sets of feature files', function() {
    
  });

  this.When('the features are initialized', function() {
    var Feature = require('app/models/feature/Feature');
    this.features = [];
    this.features.push(new Feature({file: featureFile1}));
    this.features.push(new Feature({file: featureFile2}));
  });
  
  this.Then('<feature-count> features will be run', function(f_count) {
    var includedFeatures = _.where(this.features, {exclude: false});
    expect(includedFeatures.length).to.be.equal(f_count);
  });

  this.Then('<scenario-count> scenarios will be run', function(s_count) {
    var scenarios = [];
    this.features.forEach( feature => {
      scenarios = scenarios.concat(feature.scenarios);
    });

    var includedScenarios = _.where(scenarios, {exclude: false});

    expect(includedScenarios.length).to.be.equal(s_count);
  });
}