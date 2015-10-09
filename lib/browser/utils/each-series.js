import $ from 'jquery';

export default function eachSeries (arr, iterator, callback) {
  var promise = new $.Deferred();

  callback = callback || function () {};
  if (!arr.length) {
      return callback();
  }
  var completed = 0;
  var iterate = function () {
      iterator(arr[completed], function (err) {
          if (err) {
              callback(err);
              promise.reject(err);
              callback = function () {};
          }
          else {
              completed += 1;
              if (completed >= arr.length) {
                  promise.resolve();
                  callback();
              }
              else {
                  iterate();
              }
          }
      });
  };
  iterate();

  return promise;
}