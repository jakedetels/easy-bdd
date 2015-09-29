export default function getArgumentNames(fn) {
  var type = typeof fn;
  if (type !== 'function') {
    throw new Error('getArgumentNames expects argument 1 to be a function. Received: ' + type);
  }

  var match = fn.toString().match(/([\w\s,]+)\)/);
  var args = match ? match[1].split(/[\s,]+/) : [];
  return args;
}