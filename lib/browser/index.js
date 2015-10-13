import $            from 'jquery';
import FeatureTree  from './models/feature-tree/FeatureTree';
import Feature      from './models/feature/Feature';
import Scenario     from './models/scenario/Scenario';
import Example      from './models/scenario/Example';
import StepRecord   from './models/step/StepRecord';
import StepFunction from './models/step/StepFunction';
import World        from './models/world/World';
import Universe     from './models/universe/Universe';
import init         from './initialize-testing';
import UI           from './ui/index';
import utils        from './utils/index';
import Events       from './Events';
import filter       from './Filter';
import helpers      from './helpers/helpers';
import _            from 'underscore';

window._.noConflict();

var isPhantom = /PhantomJS/.test(window.navigator.userAgent);
if (isPhantom) {
  require('bdd/utils/phantom-shims');
}

var BDD = window.BDD = require('BDD');
_.extend(BDD, window.BDD_options);

var ui = new UI();

_.extend(BDD, {
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
  start       : init,
  ui          : ui,
  utils       : utils,
  queryParams : utils.queryParams(),
  filter      : filter
});

BDD.CONFIGS = {
  promiseTimeout: 1000
};

var coverage = utils.queryParams('coverage');
if (coverage) {
  // blanket.options({debug: true});
  
  let selector = typeof coverage === 'string' ? coverage : '';
  let filter = new RegExp('^' + BDD.appModuleRoot + '/.*' + selector, 'i');
  
  blanket.options('filter', filter);
  blanket.options('branchTracking', true);
  require('bdd/blanket/loaderjs-adapter');
}
var loadTests = require('bdd/loaders/load-tests-amd');

BDD.tree = loadTests();

var useTestem = typeof Testem !== 'undefined';
var testemAdapter;
if (useTestem) {
  testemAdapter = require('bdd/testem/testem-adapter');
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
  require('bdd/blanket/adapter');
  blanket.beforeStartTestRunner({ callback: begin });  
} else {
  begin();
}
