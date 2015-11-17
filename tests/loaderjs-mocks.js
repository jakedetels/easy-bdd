/* global require:true, requirejs:true */

require = requirejs = (function(_require) {

  var mockCount = 0;

  for (var key in _require) {
    mockRequire[key] = _require[key];
  }

  mockRequire.mocks = {};
  mockRequire.originalModules = {};
  mockRequire.mock = mock;
  mockRequire.restore = restore;
  mockRequire.clear = clear;

  return mockRequire;

  function mockRequire(moduleName, mocks) {
    if (arguments.length === 1) {
      return _require(moduleName);
    }
    
    // Add mocks to registry
    for (var name in mocks) {
      mock(name, mocks[name]);
    }

    var exports = _require(moduleName);

    restore();

    return exports;
  }

  function mock(moduleName, mockModule) {
    var mod = _require.entries[moduleName];
    mockRequire.originalModules[moduleName] = mod.callback;
    mod.callback = createCallback(mockModule, moduleName);
  }

  function createCallback(mockModule, moduleName) {
    // The technique of using the Function constructor is required
    // to presevere original scope of mocked module. Allows
    // compatibility with test coverage tools like blanket.js.
    var fnName = 'fn' + '_' + (++mockCount) + '_' + moduleName;
    mockRequire.mocks[fnName] = mockModule;
    return new Function('return window.require.mocks["' + fnName + '"];');
  }

  function restore() {
    for (var moduleName in mockRequire.originalModules) {
      _require.unsee(moduleName);
      _require.entries[moduleName].callback = mockRequire.originalModules[moduleName];
      delete mockRequire.originalModules[moduleName];
    }
  }

  function clear(path) {
      if (! path) {
        return _require.clear();
      }

      var regex = new RegExp('^' + path);

      for (var moduleName in _require.entries) {
        if (moduleName.match(regex)) {
          _require.unsee(moduleName);
        }
      }
  }

})(require);
