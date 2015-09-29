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

$(window).on('error', function(event) {
  tryCatch.uncaughtError = event.originalEvent.error;
});

export default tryCatch;