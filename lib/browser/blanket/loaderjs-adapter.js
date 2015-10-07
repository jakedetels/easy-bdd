var _require = window.require;

var seen = {};

var filter = blanket.options('filter');

function newRequire(moduleName) {
  if (typeof(seen[moduleName]) === 'undefined') {
    seen[moduleName] = true;
    if (moduleName.match(filter)) {
      instrumentModule(moduleName);
    }
  }
  return _require(moduleName);
}

for (var key in _require) {
  newRequire[key] = _require[key];
}

window.require = window.requirejs = newRequire;

function instrumentModule(moduleName) {
  blanket.requiringFile(moduleName);

  var module = _require.entries[moduleName];

  var dependencies = module.deps.map(name => '"' + name + '"');

  var content =
      "define(\"" + moduleName + "\", " +
      '[' + dependencies.join(', ') + '], ' + 
      module.callback.toString() +
      ");//# sourceURL=" + moduleName + ".js";

  blanket.utils.processFile(content, moduleName, function() {}, function() {});
}

blanket.options('reporter', blanket.customReporter);