import Scenario from './Scenario';
import Example from './Example';
import StepRecord from './StepRecord';
import smartTypeCast from '../utils/smartTypeCast';

export default Parser;

function Parser(feature) {

  this.feature = feature;

  this.tagsToAssign = [];

  this.active = {};

  var debug = false;
  var lines = feature.file.replace(/\n\s*/gm, '\n').split('\n');

  while (lines.length) {
    let line = lines.shift();
    
    if (debug) {
      debug = false;
      debugger; /* jshint ignore:line */
    }

    this.active.line = line;
    
    let lineType = getLineType(line);

    if (lineType === 'previous') {
      lineType = this.active.lastStepPrefix;
    }

    this.active.lineType = lineType;

    if (typeof this.process[lineType] === 'function') {
      this.process[lineType].call(this);
    } else if (lineType === 'debugger') {
      debug = true;
    } else if (lineType === 'comment') {
      // do nothing
    } else if (! feature.background) {
      this.process.narrative.call(this);
    } else {
      console.debug('line: ' + line);
    }

    this.active.lastLineType = lineType;
  }
}

var fn = Parser.prototype;

var keywords = [
  {pattern: '#',             type: 'comment'},
  {pattern: 'feature:',      type: 'feature_start'},
  {pattern: 'background:',   type: 'background_start'},
  {pattern: 'scenario:',     type: 'scenario_start'},
  {pattern: 'examples:',     type: 'examples_start'},
  {pattern: '@',             type: 'tags'},
  {pattern: '\\|',           type: 'table'},
  {pattern: 'given',         type: 'Given'},
  {pattern: 'when',          type: 'When'},
  {pattern: 'then',          type: 'Then'},
  {pattern: 'and|but',       type: 'previous'},
  {pattern: 'debugger',      type: 'debugger'}
];

function getLineType(line) {
  var regex, match;
  for (var i = 0, len = keywords.length; i < len; i++) {
    regex = new RegExp('^\\s*' + keywords[i].pattern, 'i');
    match = line.match(regex);
    if (match) {
      return keywords[i].type;
    }
  }
}

fn.process = {};

fn.process.feature_start = function() {
  this.feature.name = this.active.line.match(/feature: *(.*)/i)[1];
  this.feature.tags = this.emptyTags();
  this.feature.skip = !! this.feature.tags.join().match(/\b(skip|ignore)\b/);
};

fn.process.background_start = function() {
  this.backgroundToAssign = this.active.stepHolder = {
    steps: [],
    given: []
  };
};

fn.process.scenario_start = function() {
  var tags = this.emptyTags();
  var scenario = new Scenario(this.feature, {
    tags: tags,
    skip: !! tags.join().match(/\b(skip|ignore)\b/),
    name: this.active.line.match(/scenario: *(.*)/i)[1]
  });

  if (this.backgroundToAssign) {
    this.assignBackground(scenario);
  }

  this.feature.scenarios.push(scenario);
  this.active.stepHolder = scenario;
  this.active.scenario = scenario;
};

fn.assignBackground = function(scenario) {
  scenario.steps = this.backgroundToAssign.steps.concat(scenario.steps);
  scenario.given = this.backgroundToAssign.given.concat(scenario.given);
};

fn.process.Given = function() {
  var type = this.active.lineType;
  var regex = new RegExp('^(' + type + '|and|but) *(.*)', 'i');
  var match = this.active.line.match(regex);
  var prefix = match[1];
  prefix = this.backgroundToAssign && prefix === 'Given' && this.backgroundToAssign.steps.length ? 'And' : prefix;
  var step = new StepRecord({
    type: type,
    name: match[2],
    prefix: prefix
  });

  step.tags = this.emptyTags();
  
  this.active.step = step;
  this.active.stepHolder.steps.push(step);
  this.active.stepHolder[this.active.lineType.toLowerCase()].push(step);

  this.active.lastStepPrefix = type;
};

fn.process.When = fn.process.Then = fn.process.Given;

fn.process.examples_start = function() {
  this.active.scenario.examples = [];
  this.active.scenario.examples.examples = true;
};

fn.process.table = function() {
  var cells = this.active.line.split('|');
  var table = this.active.table;
  var lastLineType = this.active.lastLineType;
  cells.shift();
  cells.pop();
  // cells = cells.map(val => val.trim() );
  cells = cells.map(val => smartTypeCast ( val.trim() ) );

  if (lastLineType === 'examples_start') {
    table = this.active.scenario.examples;
    table.headers = cells;
  } else if (lastLineType.match(/Given|When|Then/)) {
    table = this.active.step.table = cells;
    if (cells.length === 1) {
      table.headers = false;
    }
  } else {
    if (table.headers) {
      addTableRow(cells, table);
    } else if (table.headers === undefined) {
      var headers = table;
      table = this.active.step.table = [];
      table.headers = headers;
      var row = addTableRow(cells, table);
      table.first = row;
    } else {
      table.push(cells);
    }
  }

  this.active.table = table;
};

fn.process.tags = function() {
  var tags = this.active.line.trim().replace(/@/g, '').replace(/,\s*/g, ' ').split(/\s+/g);
  this.tagsToAssign = this.tagsToAssign.concat(tags);
};

fn.process.narrative = function() {
  this.feature.narrative = this.feature.narrative || [];
  this.feature.narrative.push(this.active.line);
};

fn.emptyTags = function() {
  return this.tagsToAssign.splice(0, this.tagsToAssign.length);
};

function addTableRow(cells, tableFor) {
  
  var data = {};
  tableFor.headers.forEach((header, i) => data[header] = cells[i]);
  
  var row = tableFor.examples ? new Example(tableFor.headers, data) : data;
  tableFor.push(row);
  tableFor.last = row;
  return row;
}