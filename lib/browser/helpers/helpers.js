import $ from 'jquery';
import BDD from 'BDD';

export default {
  click
};

function click(selector, context) {
  var $el = $(selector, context);
  if ($el.length === 0 && BDD.activeTestPromise) {
    try {
      BDD.assert(false, 'No element found: ' + selector);  
    } catch(e) {
      BDD.activeTestPromise.reject(e);
    }
  } else {
    $el.click();
  }
}