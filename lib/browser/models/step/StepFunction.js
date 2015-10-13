import BDD from 'BDD';

export default StepFunction;

function StepFunction(stepName, fn, options = {}) {
  
  BDD._.extend(this, options);
  
  this.stepName = stepName;
  this.fn = fn || function() {};
  this.regex = this.createRegex();
  
  this.extractAssertions();
  
  this.isAsync = !! fn.toString().match(/function[^\)]+done\s*\)/);
}

var fn = StepFunction.prototype;

fn.createRegex = function() {
  var step = this.stepName;
  var isRegex = false;
  var variableRegex = /\$\{[^\}]+\}/g;
  var regex;

  if (step instanceof RegExp) {
    isRegex = true;
    regex = step;
  } else if (step.match(variableRegex)) {
    regex = new RegExp('^' + step.replace(variableRegex, '(.+)') + '$', 'i');
    isRegex = true;
  } else{
    regex = new RegExp('^' + step + '$', 'i');
  }

  return regex;
};

fn.getArgumentsObject = function(stepRecord) {
  var variableValues = this.getVariableValues(stepRecord);

  if (! this.variableNames) {
    this.variableNames = this.getVariableNames();
  }

  var variableNames = this.variableNames;

  var argsObject = {};

  for (var i = 0; i < variableNames.length; i++) {
    argsObject[variableNames[i]] = variableValues[i];
  }

  return argsObject;
};

fn.getVariableNames = function() {
  var variableNames = [];
  var regex = /\$\{([^\}]+)\}/g;
  var match;
  while (match = regex.exec(this.stepName)) {
    variableNames.push(match[1]);
  }

  return variableNames;
};

fn.getVariableValues = function(stepRecord) {
  var match = stepRecord.name.match(this.regex);
  if (! match) {
    throw new Error('stepFunction was given a mismatched stepRecord');
  }

  var args = [];
  var i, value;

  for (i = 1; i < match.length; i++) {
    value = match[i];
    value = BDD.utils.smartTypeCast(value);
    args.push(value);
  }

  if (stepRecord.table) {
    args.push(stepRecord.table);
  }

  return args;
};

fn.extractAssertions = function extractAssertions() {
  var str = this.fn.toString();
  var regex = /\s*((expect|assert)[\(\.][^;]+;)/g;
  var match;

  str = BDD.utils.stripComments(str);

  this.assertions = [];
  while (match = regex.exec(str)) {
    let assertion = BDD.utils.htmlEscape( match[1].trim() );
    this.assertions.push(assertion);
  }
  return this.assertions;
};