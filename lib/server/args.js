var argsArray = process.argv.slice(2);
var args = {};

argsArray.forEach(function(item) {
  var parts = item.split('=');
  var name = parts[0];
  var value = parts.length === 1 ? true : parts[1];
  args[name] = value;
});

module.exports = args;