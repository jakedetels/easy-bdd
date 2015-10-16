import $ from 'jquery';

var promises = {};

promises.create =  function createPromise(failMsg, waitTime) {
  waitTime = waitTime || 1000;
  failMsg = failMsg || 'Promise failed to resolve within specified wait time of ' + waitTime + 'ms';
  var promise = $.Deferred(),
      resolve = promise.resolve,
      timer = setTimeout(function() {
        promise.reject(failMsg);
      }, waitTime);

  promise.resolve = function(response) {
    clearTimeout(timer);
    resolve(response);
  };

  return promise;
};

promises.isPromise = function isPromise(val) {
  return val && typeof val.then === 'function';
};

export default promises;