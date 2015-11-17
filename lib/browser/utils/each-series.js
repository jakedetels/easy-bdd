import RSVP from 'RSVP';

export default function eachSeries (arr, iterator) {
  var completed = 0;

  return new RSVP.Promise(function(resolve, reject) {
    iterate();
    
    function iterate() {
      if (completed >= arr.length) {
        resolve();
        return;
      }

      iterator(arr[completed], function (err) {
        if (err) {
          reject(err);
        } else {
          completed += 1;
          iterate();
        }
      });
    }
  });
}
