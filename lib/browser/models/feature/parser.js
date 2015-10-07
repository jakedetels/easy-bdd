import BDD from 'BDD';

export default Parser;

function Parser(feature) {

  this.feature = feature;

  this.tagsToAssign = [];

  this.active = {};

  var lineType;
  var debug = false;
  var lines = feature.file.replace(/\n\s*/gm, '\n').split('\n');
  var line = lines.shift();

  while (line) {
    
    if (debug) {
      debug = false;
      debugger; /* jshint ignore:line */
    }

    this.active.line = line;
    
    lineType = getLineType(line);

    if (lineType === 'previous') {
      lineType = this.active.lastLineType;
    }

    this.active.lineType = lineType;

    if (typeof this.process[lineType] === 'function') {
      this.process[lineType].call(this);
    } else if (lineType === 'debugger') {
      debug = true;
    } else if (! feature.background) {
      this.process.narrative.call(this);
    } else {
      console.debug('line: ' + line);
    }

    this.active.lastLineType = lineType;
    line = lines.shift();
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
  var background = {
    steps: [],
    given: []
  };
  this.active.stepHolder = background;
  this.feature.background = background;
};

fn.process.scenario_start = function() {
  // var scenario = new BDD.Scenario(this.feature.World);
  // scenario.tags = this.emptyTags();
  // scenario.skip = !! scenario.tags.join().match(/\b(skip|ignore)\b/);
  // scenario.name = this.active.line.match(/scenario: *(.*)/i)[1];
  var tags = this.emptyTags();
  var scenario = new BDD.Scenario(this.feature.World, {
    tags: tags,
    skip: !! tags.join().match(/\b(skip|ignore)\b/),
    name: this.active.line.match(/scenario: *(.*)/i)[1]
  });
  // var tags = ;
  // var skip = ;
  // scenario.name = ;

  this.feature.scenarios.push(scenario);
  this.active.stepHolder = scenario;
  this.active.scenario = scenario;
};

fn.process.Given = function() {
  var regex = new RegExp('^(' + this.active.lineType + '|and|but) *(.*)', 'i');
  var match = this.active.line.match(regex);
  var step = new BDD.StepRecord({
    type: this.active.lineType,
    name: match[2],
    prefix: match[1]
  });

  step.tags = this.emptyTags();
  
  this.active.step = step;
  this.active.stepHolder.steps.push(step);
  this.active.stepHolder[this.active.lineType.toLowerCase()].push(step);
};

fn.process.When = fn.process.Then = fn.process.Given;

fn.process.examples_start = function() {
  this.active.scenario.examples = [];
};

fn.process.table = function() {
  var cells = this.active.line.split('|');
  var table = this.active.table;
  // var table = this.active.table || [];
  var lastLineType = this.active.lastLineType;
  cells.shift();
  cells.pop();
  cells = cells.map(val => val.trim() );


  if (lastLineType === 'examples_start') {
    table = this.active.scenario.examples;
    table.headers = cells;
  } else if (lastLineType.match(/Given|When|Then/)) {
    // this.table = this.active.step.table = cells;
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
  var tags = this.active.line.trim().replace('@', '').split(/\s+/g);
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
  var row = {};
  tableFor.headers.forEach((header, i) => row[header] = cells[i]);
  tableFor.push(row);
  tableFor.last = row;
  return row;
}