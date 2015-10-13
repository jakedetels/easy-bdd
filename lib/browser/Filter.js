// npm test exclude="feature@uncaught,scenario@foo,@foo@bar,/foo/bar/,/path/to/file/feature[hello world]@foo@bar"
import _ from 'underscore';
import queryParams from './utils/query-params';

function Filter() {
  var params = queryParams();
  
  this.exclude = params.exclude ? this.parseSelectors(params.exclude) : [];

  this.include = params.include ? this.parseSelectors(params.include) : [];
}

var fn = Filter.prototype;

fn.parseSelectors = function(string) {
  string = decodeURIComponent(string);

  var selectors = [];
  var parts = string.split(',');
  var selector, str, andParts, container;

  for (var i = 0, len = parts.length; i < len; i++) {
    selector = {
      feature: null,
      scenario: null,
      parts: 0
    };
    str = parts[i];

    selector.selector = str;

    andParts = str.split('+');

    andParts.forEach( part => {
      let type = part.match(/^(feature|scenario)|[\/,\]]?(feature|scenario)/g) || ['scenario'];

      type = type ? type[0].replace(/\W/g, '') : 'scenario';

      container = selector[type] = {};

      let nameMatch = part.match(/\[([^\]]+)]/);
      
      if (nameMatch) {
        selector.parts++;
        container.name = nameMatch[1];
      }

      let tags = part.match(/@[\w-]+/g);
      
      if (tags) {
        selector.parts++;
        container.tags = tags.join(',').replace(/@/g, '').split(',');
      }

      let moduleName = part.match(/\/.*\//);

      if (moduleName) {
        selector.parts++;
        container.module = moduleName[0];
      }

      let isEmptySelector = selector[type] && Object.keys(selector[type]).length === 0;
      if (isEmptySelector) {
        selector[type] = null;
      }
    });

    if (selector.parts > 0) {
      selectors.push(selector);  
    }
  }

  return selectors;
};

fn.shouldFilterOut = function(type, model) {

  if (this.exclude.length) {
    if ( this.shouldExclude(type, model) ) {
      return true;
    }
  }

  if (this.include.length) {
    return ! this.shouldInclude(type, model); 
  }

  return false;
};

fn.shouldExclude = function(type, model) {
  var selector;

  for (var i = 0; i < this.exclude.length; i++) {
    selector = this.exclude[i];

    if (selector[type] &&  this.selectorMatches(type, model, selector[type]) ) {
      return true;
    }
  }

  return false;
};

fn.shouldInclude = function(type, model) {
  var selector;

  for (var i = 0; i < this.include.length; i++) {
    selector = this.include[i];

    if (selector[type] && ! this.selectorMatches(type, model, selector[type]) ) {
      return false;
    }

    if ( this.selectorMatches(type, model, selector) ) {
      return true;
    }
  }

  return false;
};

fn.selectorMatches = function(type, model, selector) {
  var nameMatches = !! (selector.name && model.name.toLowerCase().match(selector.name.toLowerCase()));  
  if (selector.name && ! nameMatches) { return false; }

  if (selector.tags) {
    let tagsMatch = _.intersection(model.tags, selector.tags).length === selector.tags.length;
    if (! tagsMatch) { return false; }
  }

  return true;
};

export default new Filter();