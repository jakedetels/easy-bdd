// npm test exclude="feature@uncaught,scenario@foo,@foo@bar,/foo/bar/,/path/to/file/feature[hello world]@foo@bar"
import _ from 'underscore';
import queryParams from './utils/query-params';

function Filter() {
  var params = queryParams();
  
  if (params.exclude) {
    this.exclude = this.parseSelectors(params.exclude);
  }

  if (params.include) {
    this.include = this.parseSelectors(params.include);
  }
}

var fn = Filter.prototype;

fn.parseSelectors = function(string) {
  string = decodeURIComponent(string);

  var selectors = [];
  var parts = string.split(',');

  var selector, str, name, nameMatch, tags, moduleName, type;
  for (var i = 0, len = parts.length; i < len; i++) {
    selector = {};
    str = parts[i];

    selector.selector = str;

    type = str.match(/^(feature|scenario)|[\/,\]]?(feature|scenario)/g);

    if (type) {
      selector.type = type[0].replace(/\W/g, '');
    }

    nameMatch = str.match(/\[([^\]]+)]/);
    
    if (nameMatch) {
      selector.name = nameMatch[1];
    }
    
    tags = str.match(/(@[^@]+)/g);

    if (tags) {
      selector.tags = tags.join(',').replace(/@/g, '').split(',');
    }

    moduleName = str.match(/\/.*\//);

    if (moduleName) {
      selector.module = moduleName[0];
    }

    selectors.push(selector);
  }

  return selectors;
};

fn.shouldFilterOut = function(type, model) {

  if (this.exclude) {
    if ( this.shouldExclude(type, model) ) {
      return true;
    }
  }

  return ! this.shouldInclude(type, model);
};

fn.shouldExclude = function(type, model) {
  var selector;

  for (var i = 0; i < this.exclude.length; i++) {
    selector = this.exclude[i];
    if ( this.selectorMatches(type, model, selector) ) {
      return true;
    }
  }

  return false;
};

fn.shouldInclude = function(type, model) {
  if (! this.include) {
    return true;
  }
  
  var selector;

  for (var i = 0; i < this.include.length; i++) {
    selector = this.include[i];
    if ( this.selectorMatches(type, model, selector) ) {
      return true;
    }
  }

  return false;
};

fn.selectorMatches = function(type, model, selector) {
  if (selector.type && selector.type !== type) { return true; }

  var nameMatches = !! (selector.name && model.name.toLowerCase().match(selector.name.toLowerCase()));  
  if (selector.name && ! nameMatches) { return false; }

  if (selector.tags) {
    let tagsMatch = _.intersection(model.tags, selector.tags).length === selector.tags.length;
    if (! tagsMatch) { return false; }
  }

  return true;
};

export default new Filter();