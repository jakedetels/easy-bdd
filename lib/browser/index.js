import $            from 'jquery';
import FeatureTree  from './models/FeatureTree';
import Feature      from './models/Feature';
import Scenario     from './models/Scenario';
import Example      from './models/Example';
import StepRecord   from './models/StepRecord';
import StepFunction from './models/StepFunction';
import World        from './models/World';
import Universe     from './models/Universe';
import UI           from './ui/index';
import utils        from './utils/index';
import Events       from './Events';
import filter       from './Filter';
import helpers      from './helpers/helpers';
import _            from 'underscore';
import Obey         from 'Obey';

export default Obey;

window._.noConflict();

var isPhantom = /PhantomJS/.test(window.navigator.userAgent);
if (isPhantom) {
  _import('utils/phantom-shims');
}

window.Obey = Obey;

_.extend(Obey, window.Obey_options);

var ui = new UI();

_.extend(Obey, {
  $           : $,
  chai        : require('chai'),
  _           : _,
  helpers     : helpers,
  FeatureTree : FeatureTree,
  Feature     : Feature,
  Scenario    : Scenario,
  Example     : Example,
  World       : World,
  Universe    : Universe,
  StepRecord  : StepRecord,
  StepFunction: StepFunction,
  Events      : Events,
  ui          : ui,
  utils       : utils,
  queryParams : utils.queryParams(),
  filter      : filter,
  run         : run
});

Obey.CONFIGS = {
  promiseTimeout: 1000
};

Obey.setTree = function(tree) {
  this.tree = tree;
};

var testemAdapter = prepareTestem();
var coverage = utils.queryParams('coverage');
var loadTests = _import('loaders/load-tests-amd');

if (Obey.autoRun !== false) {

  Obey.setTree( loadTests() );
  
  if (coverage) {
    prepareCoverage();
  } else {
    run();
  }

}

function run() {
  ui.setupPage();

  Events.on('afterFeature', function(feature) {
    // setTimeout(ui.printFeatureTestResults.bind(ui, feature));
    ui.printFeatureTestResults(feature);
  });

  setTimeout(function() {

    Obey.tree.init();
    
    var features = Obey.tree.getFeatures();

    Obey.Feature.run(features).then(function() {
      if (testemAdapter) {
        testemAdapter.end();
      }

      ui.cleanUp();
    });
  });
}

function prepareTestem() {
  var useTestem = typeof Testem !== 'undefined';
  var testemAdapter;
  if (useTestem) {
    testemAdapter = _import('testem/testem-adapter');
    testemAdapter.start();
  }
  return testemAdapter;
}

function prepareCoverage() {
  // blanket.options({debug: true});
  
  let selector = typeof coverage === 'string' ? coverage : '';
  let filter = new RegExp('^' + Obey.appModuleRoot + '/.*' + selector, 'i');
  
  blanket.options('filter', filter);
  blanket.options('branchTracking', true);
  _import('blanket/loaderjs-adapter');

  _import('blanket/adapter');
  blanket.beforeStartTestRunner({ callback: run });
}

function _import(moduleName) {
  var prefix = require.modulePrefix;
  return require(prefix + '/' + moduleName);
}