import $ from 'jquery';
import queryParams from './query-params';

var tryCatch;
var notrycatch = queryParams('notrycatch');

if (notrycatch) {
  tryCatch = function tryCatch(fn) {
    tryCatch.justThrewError = true;
    fn();
    tryCatch.reset();
  };
} else {
  tryCatch = function tryCatch(tryFn, catchFn) {
    try {
      tryCatch.justThrewError = true;
      tryFn();
      tryCatch.reset();
    } catch(e) {
      catchFn(e);
    }
  };
}

tryCatch.reset = function() {
  tryCatch.justThrewError = false;
  tryCatch.uncaughtError = null;
};

tryCatch.wasUncaughtErrorThrown = function() {
  var error = tryCatch.uncaughtError;
  return error && ! error.obeyHandled;
};

tryCatch.getUncaughtError = function() {
  var error = tryCatch.uncaughtError;
  if (error) {
    error.obeyHandled = true;
  }
  return error;
};

$(window).on('error', function(event) {
  tryCatch.justThrewError = true;
  tryCatch.uncaughtError = event.originalEvent.error;
});

export default tryCatch;