import BDD from 'BDD';

export default StepFunction;

function StepFunction(regex, fn, options = {}) {
  BDD._.extend(this, options);
  this.regex = regex;
  this.fn = fn;
  this.extractAssertions();
  this.isAsync = !! fn.toString().match(/function[^\)]+done\s*\)/);
}

StepFunction.prototype.extractArguments = function extractArguments(stepRecord) {
  var match = stepRecord.name.match(this.regex);
  if (! match) {
    throw new Error('stepFunction was given a mismatched stepRecord');
  }

  var args = [];
  var i, value;

  for (i = 1; i < match.length; i++) {
    value = match[i];
    value = this.smartTypeCast(value);
    args.push(value);
  }

  if (stepRecord.table) {
    args.push(stepRecord.table);
  }

  return args;
};

StepFunction.prototype.smartTypeCast = function smartTypeCast(value) {
    if (Number(value) && ! isNaN(Number(value)) && value.length < 17) {
      value = Number(value);
    } else if (value.match(/true/i)) {
      value = true;
    } else if (value.match(/false/i)) {
      value = false;
    }

    return value;
};

StepFunction.prototype.extractAssertions = function extractAssertions() {
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