import location from './globals/location';

export default queryParams;

var params = location.search.substr(1).split('&');
var paramsObject = {};
var i, len, parts;
for (i = 0, len = params.length; i < len; i++) {
  parts = params[i].split('=');
  if (! parts[0]) {continue;}
  paramsObject[parts[0]] = parts[1] || true;
}

function queryParams(params) {
  // var _params = location.search.substr(1).split('&');
  // var obj = paramsObject;
  // var obj = {}, i, parts, len, key, value;
  // var i, parts, len, key, value;
  var parts, key, value;

  if (typeof params === 'string') {
    if (arguments.length === 2) {
      paramsObject[params] = arguments[1];
      params = paramsObject;
      paramsObject = {};
    } else {
      value = (location.search.match(new RegExp('[?&]' + params + '=?([^&]*)[&#$]?')) || [])[1];
      return value === '' ? true : value;
    }
  } else if (typeof params !== 'object') {
    return paramsObject;
  }

  // var _params = location.search.substr(1).split('&');

  // for (i = 0, len = _params.length; i < len; i++) {
  //   parts = _params[i].split('=');
  //   if (! parts[0]) {continue;}
  //   obj[parts[0]] = parts[1] || true;
  // }

  // if (typeof params !== 'object') {return obj;}

  for (key in params) {
    value = params[key];
    if (typeof value === 'undefined') {
      delete paramsObject[key];
    } else {
      paramsObject[key] = value;
    }
  }

  parts = [];
  for (key in paramsObject) {
    parts.push(key + (paramsObject[key] === true ? '' : '=' + paramsObject[key]));
  }

  location.search = parts.join('&');
}