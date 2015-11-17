export default function() {
  
  this.World = function() {
    window.Obey_options = {autoRun: false, fixture: '#test-fixture'};
    require.mock('app/utils/query-params', function() { if (! arguments.legnth) {return {}; }  });
    var Obey = this.Obey = require('app/index');

    this.setupObey = function(files) {
      var tree = new Obey.FeatureTree('root');
      for (var name in files) {
        tree.addToTree(name, files[name]);
      }
      Obey.setTree(tree);
    };

    this.showFixture = function() {
      this.Obey.ui.$fixture.show();
    };
  };

}