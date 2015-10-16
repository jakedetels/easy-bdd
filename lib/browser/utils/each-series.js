import $ from 'jquery';

export default function eachSeries (arr, iterator, callback) {
  callback = callback || function () {};

  var promise = new $.Deferred();
  var completed = 0;

  iterate();

  return promise;
  
  function iterate() {
    if (completed >= arr.length) {
      callback();
      return promise.resolve();
    }

    iterator(arr[completed], function (err) {
      if (err) {
        callback(err);
        promise.reject(err);
      } else {
        completed += 1;
        iterate();
      }
    });
  }
}
