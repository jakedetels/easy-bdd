import $ from 'jquery';
import BDD from 'BDD';
import {assert} from '../assertions';

export default {
  click,
  fillIn
};

function click(selector, context) {
  var $el = findWithAssert(selector, context);

  $el.click();
}

function fillIn(selector, context, values) {
  if (arguments.length === 2) {
    values = context;
    context = 'body';
  }

  var $el = findWithAssert(selector, context);

  if ( ! $el.first().is(':input')) {
    return reject('"' + selector + '" is not a form element');
  }

  var type = $el.first().attr('type') || '';
  values = [].concat(values);

  if (type.match(/radio|checkbox/)) {
    
    $el.filter(function() {
      return values.indexOf( $(this).attr('value') ) > -1;
    }).prop('checked', true);
  } else {
    $el.val(values.join(''));
  }
}

function findWithAssert(selector, context) {
  var $el = $(selector, context);

  if ($el.length) {
    return $el;
  }

  reject('No element found: ' + selector);
}

function reject(msg) {
  if (BDD.activeStepPromise) {
    try {
      assert(false, msg);
    } catch(e) {
      BDD.activeStepPromise.reject(e);
    }
  }
}