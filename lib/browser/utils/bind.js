export default function bind(fn, _this, args = []) {
  var boundFn = fn.bind.apply(fn, [_this].concat(args));
  
  boundFn._bindings = {
    fn: fn,
    _this: _this,
    args: args
  };

  boundFn.toString = function() { return fn.toString(); };

  return boundFn;
}