import getArgumentNames from './getArgumentNames';

export function callWith(context, fn, argumentsObject) {
  if (arguments.length === 2 && typeof fn === 'object') {
    argumentsObject = fn;
    fn = context;
    context = null;
  }

  var args = postionArguments(fn, argumentsObject);
  
  return fn.apply(context, args);
}

export function bindWith(context, fn, argValues) {
  if (arguments.length === 2 && typeof fn === 'object') {
    argValues = fn;
    fn = context;
    context = null;
  }

  var args = postionArguments(fn, argValues);

  args.unshift(context);

  return Function.prototype.bind.apply(fn, args);
}

function postionArguments(fn, argumentsObject) {
  var args = [];

  fn.argNames = fn.argNames || getArgumentNames(fn);

  for (var argName in argumentsObject) {
    let index = indexOfRegex(fn.argNames, argName);
    if (index > -1) {
      args[index] = argumentsObject[argName];
    }
  }

  if (Array.isArray(argumentsObject._extras)) {
    args = args.concat(argumentsObject._extras);
  }

  return args;
}

function indexOfRegex(array, regex) {
  if (typeof regex === 'string') {
    regex = new RegExp('^' + regex + '$');
  }

  for (var i = 0; i < array.length; i++) {
    if (array[i].match(regex)) { return i; }
  }
  return -1;
}