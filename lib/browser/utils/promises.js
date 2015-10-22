import $ from 'jquery';

var promises = {};

promises.create =  function createPromise(failMsg, waitTime) {
  waitTime = waitTime || 1000;

  var promise = $.Deferred();
  var resolve = promise.resolve;
  var timer = setTimeout(reject, waitTime);

  promise.resolve = function(response) {
    clearTimeout(timer);
    resolve(response);
  };

  return promise;

  function reject() {
    failMsg = failMsg || 'Promise failed to resolve within specified wait time of ' + waitTime + 'ms';
    var error = new Error(failMsg);
    error.name = 'PromiseError';
    promise.reject(error);
  }
};

promises.isPromise = function isPromise(val) {
  return val && typeof val.then === 'function';
};

export default promises;