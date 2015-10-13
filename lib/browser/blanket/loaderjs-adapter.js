var _require = window.require;

var seen = {};

var filter = blanket.options('filter');

function blanketRequire(moduleName) {
  if (typeof(seen[moduleName]) === 'undefined') {
    seen[moduleName] = true;
    if (moduleName.match(filter)) {
      instrumentModule(moduleName);
    }
  }
  return _require.apply(null, arguments);
}

for (var key in _require) {
  blanketRequire[key] = _require[key];
}

window.require = window.requirejs = blanketRequire;

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

export function loadUnusedModules() {
  for (var moduleName in _require.entries) {
    if ( ! seen[moduleName] && moduleName.match(filter)) {
      instrumentModule(moduleName);
    }
  }
}