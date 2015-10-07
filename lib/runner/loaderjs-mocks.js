/* global require:true, requirejs:true */

require = requirejs = (function(_require) {

  function newRequire(moduleName, mocks) {
    if (arguments.length === 1) {
      return _require(moduleName);
    }

    var originalDeps = {};
    var name, mod;
    
    // Add mocks to registry
    for (name in mocks) {
      mod = _require.entries[name];
      originalDeps[name] = mod.callback;
      mod.callback = createCallback(mocks[name]);
    }

    function createCallback(mockModule) {
      return function() {
        return mockModule;
      };
    }

    var exports = _require(moduleName);

    // Restore registry
    for (name in originalDeps) {
      _require.unsee(name);
      _require.entries[name].callback = originalDeps[name];
    }

    return exports;
  }

  for (var key in _require) {
    newRequire[key] = _require[key];
  }

  return newRequire;

})(require);