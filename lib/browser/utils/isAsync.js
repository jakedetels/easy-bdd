import getArgumentNames from './getArgumentNames';

export default function isAsync(fn) {
  var type = typeof fn;
  if (type !== 'function') {
    throw new Error('isAsync expects argument 1 to be a function. Received: ' + type);
  }
  
  var argNames = getArgumentNames(fn);

  return !! argNames.join().match(/\b(?:done|callback)\b/);
}