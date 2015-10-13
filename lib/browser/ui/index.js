import $                from 'jquery';
import featureTmpl      from './templates/feature';
import scenarioTmpl     from './templates/scenario';
import stepTmpl         from './templates/step';
import logTmpl          from './templates/log';
import indexTmpl        from './templates/index';
import errorTmpl        from './templates/error';
import exampleTmpl     from './templates/example';
import _                from 'underscore';
import BDD from 'BDD';


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
  index         : indexTmpl,
  error         : errorTmpl,
  example       : exampleTmpl
};

fn.printFeatureTestResults = function printFeatureTestResults(feature) {
  var html = this.renderTemplate('feature', feature);
  var $html = $(html);

  if (feature.result.status !== 'failed') {
    $('.content', $html).hide();
  }

  $('.example-error', $html).hide();
  
  $('.scenario.passed .steps', $html).hide();

  $('.step.passed .logs', $html).hide();

  $html.appendTo(this.$root.find('.features'));
};

fn.renderTemplate = function renderTemplate(templateName, data) {
  var templateFn = this.templates[templateName];
  var that = this;
  var $html;

  BDD.utils.tryCatch(function() {
    $html = $( templateFn(data) );
  },
  error => {
    let msg = 'Failed to render template "' + templateName + '".';
    console.error(new Error(msg + ' Received error: ' + error.message), 'Using template data:', data);
    $html = $('<div>').text(msg);
  });

  $html.find('[template]').each( function () {
    var $template = $(this),
        arrayName = $template.attr('records'),
        templateName = $template.attr('template');

    var records, _html;

    if (arrayName) {
      try {
        records = eval('data.' + arrayName);
      } catch(e) {}

      if (! records) {
        throw new Error('Template rendering error: "' + arrayName + '" is undefined.');
      } else if (records && ! _.isArray(records)) {
        records = [records];
      }


    } else {
      records = [data];
    }

    templateFn = that.templates[templateName];
    if (typeof templateFn !== 'function') {
      throw new Error('No template found for "' + templateName + '".');
    }

    var $list = $('<div>');
    _.each(records, (item, index) => {
      if (item instanceof Error) {
        item = {
          name: item.name,
          stack: item.stack,
          message: item.message,
          stackArray: item.stackArray || []
        };
      }
      
      item._index = index + 1;

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

fn.setupPage = function setupPage() {
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
  
  // this.$root.on('click', '.heading.toggle', function() {
  this.$root.on('click', '.toggle', function() {
    $(this).next().toggle();
  });

  this.$root.on('click', '.generate-missing-steps', function() {
    var $scenario = $(this).closest('.scenario');
    var scenario = $scenario.data('record');

    console.debug(scenario.generateMissingStepDefinitions());
  });
};