var feature = `
  Feature: Foo

  In order to A
  As a B
  I want to C

  @foo
  Scenario: apple
    Given A
    When B
    Then C
  
  Scenario: banana
    Given D
    When E
    Then F

  Scenario: cherry
    Given foo
    When bar
    Then baz
`;

var steps = function(assert) {
  this.Given('A', function() {});
  this.When('B', function() {});
  this.Then('C', function() {
    assert(true);
  });

  this.Given('D', function() {});
  this.When('E', function() {});
  this.Then('F', function() {
    assert(false);
  });
};

var featureB = `
  Feature: Bar

  In order to G
  As a H
  I want to I

  Scenario: date
    Given G
    When H
    Then I
`;

var stepsB = function(assert) {
  this.Given('G', function() {});
  this.When('H', function() {});
  this.Then('I', function() {
    assert(true);
  });
};

export default function(assert) {

  this.Given('a mix of tests', function() {

    this.setupObey({
      'my-feature': feature,
      'my-steps': steps,
      'b-feature': featureB,
      'b-steps': stepsB
    });
  });

  var $, O;
  this.When('I initialize Obey', function(done) {
    this.Obey.Events.on('afterFeatures', () => {
      $ = this.Obey.$;
      O = this.Obey.ui.$root;
      done();
    });
    this.Obey.run();
  });
  
  this.Then('<type> components will be <state>', function(list) {
    list.forEach( item => {
      let state = item.state === 'maximized' ? ':visible' : ':hidden';
      $('.' + item.type, O).each(function() {
        var $content = $('> .content', this);
        assert($content.is(state));
      });
    });

  });
  
  this.Then('missing scenarios will contain Generate button', function() {
    var $generateStepsButton = $('.scenario.missing', O).find('.generate-missing-steps');
    assert( $generateStepsButton.is(':visible') );
  });

  this.Then('missing steps will contain missing label', function() {
    var $missingStep = $('.step.missing').first();

    assert( $missingStep.text().toLowerCase().match('missing') );
  });

}