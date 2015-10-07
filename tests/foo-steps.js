/* jshint esnext:true */

export default function(assert) {
  this.Given('foo', function() {});
  this.When('bar', function() {});
  this.Then('baz', function() {
    assert(true);
  });
}