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

window._.noConflict();

var isPhantom = /PhantomJS/.test(window.navigator.userAgent);
if (isPhantom) {
  require('obey/utils/phantom-shims');
}

var Obey = window.Obey = require('Obey');
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
  filter      : filter
});

Obey.CONFIGS = {
  promiseTimeout: 1000
};

var coverage = utils.queryParams('coverage');
if (coverage) {
  // blanket.options({debug: true});
  
  let selector = typeof coverage === 'string' ? coverage : '';
  let filter = new RegExp('^' + Obey.appModuleRoot + '/.*' + selector, 'i');
  
  blanket.options('filter', filter);
  blanket.options('branchTracking', true);
  require('obey/blanket/loaderjs-adapter');
}
var loadTests = require('obey/loaders/load-tests-amd');

Obey.tree = loadTests();

var useTestem = typeof Testem !== 'undefined';
var testemAdapter;
if (useTestem) {
  testemAdapter = require('obey/testem/testem-adapter');
  testemAdapter.start();
}

ui.setupPage();

function begin() {
  setTimeout(function() {
    init().then(function() {
      if (testemAdapter) {
        testemAdapter.end();
      }

      ui.cleanUp();
    });
  });
}

if (coverage) {
  require('obey/blanket/adapter');
  blanket.beforeStartTestRunner({ callback: begin });  
} else {
  begin();
}

function init() {
  Obey.tree.init();
  
  var features = Obey.tree.getFeatures();

  return Obey.Feature.run(features, function(feature) {
    setTimeout(Obey.ui.printFeatureTestResults.bind(Obey.ui, feature), 0);
  });
}