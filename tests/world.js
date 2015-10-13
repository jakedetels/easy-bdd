export default function() {
  this.After(function() {
    require.clear('app/');
  });
}