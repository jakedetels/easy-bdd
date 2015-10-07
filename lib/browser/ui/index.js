import $                from 'jquery';
import featureTmpl      from './templates/feature';
import scenarioTmpl     from './templates/scenario';
import stepTmpl         from './templates/step';
import logTmpl          from './templates/log';
import indexTmpl        from './templates/index';
import _                from 'underscore';


export default UI;

function UI() {
  _.each(this.templates, (tmplString, name) => {
    this.templates[name] = _.template(tmplString);
  });

  this.$root = $('<div id="easy-bdd"></div>').appendTo('body');
}

var fn = UI.prototype;

fn.templates = {
  feature       : featureTmpl,
  scenario      : scenarioTmpl,
  step          : stepTmpl,
  log           : logTmpl,
  index         : indexTmpl
};

fn.printFeatureTestResults = function printFeatureTestResults(feature) {
  var html = this.renderTemplate('feature', feature);
  var $html = $(html);

  if (feature.tests.status !== 'failed') {
    $('.content', $html).hide();
  }
  
  $('.scenario.passed .steps', $html).hide();

  $('.step.passed .logs', $html).hide();

  $html.appendTo(this.$root.find('.features'));
};

fn.renderTemplate = function renderTemplate(templateName, data) {
  var templateFn = this.templates[templateName];
  var $html = $( templateFn(data) );
  var that = this;

  $html.find('[template]').each( function () {
    var $template = $(this),
        arrayName = $template.attr('records'),
        templateName = $template.attr('template');

    var records, _html;

    try {
      records = eval('data.' + arrayName);
    } catch(e) {}

    if (! records || ! _.isArray(records)) {
      throw new Error('"' + arrayName + '" is not an array.');
    }

    templateFn = that.templates[templateName];
    if (typeof templateFn !== 'function') {
      throw new Error('No template found for "' + templateName + '".');
    }

    var $list = $('<div>');
    _.each(records, (item) => {
      _html = that.renderTemplate(templateName, item);
      $list.append(_html);
    });
    $template.replaceWith($list.children());
  });
  
  if (typeof data === 'object') {
    $html.data('record', data);
  }
  
  return $html;
};

fn.setupPage = function setupPage(features) {
  var html = this.renderTemplate('index');
  this.$root = $('#easy-bdd');
  this.$fixture = $('.easy-bdd-fixture');
  this.$root.append(html);

  this.setupEventListeners();
};

fn.cleanUp = function() {
  this.$fixture.hide();
};

fn.setupEventListeners = function setupEventListeners() {
  
  this.$root.on('click', '.heading.toggle', function() {
    $(this).next().toggle();
  });

  this.$root.on('click', '.generate-missing-steps', function() {
    var $scenario = $(this).closest('.scenario');
    var scenario = $scenario.data('record');

    console.debug(scenario.generateMissingStepDefinitions());
  });
};