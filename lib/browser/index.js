import $            from 'jquery';
import FeatureTree  from './models/feature-tree/FeatureTree';
import Feature      from './models/feature/Feature';
import Scenario     from './models/scenario/Scenario';
import StepRecord   from './models/step/StepRecord';
import StepFunction from './models/step/StepFunction';
import World        from './models/world/World';
import Universe     from './models/universe/Universe';
import init         from './initialize-testing';
import UI           from './ui/index';
import utils        from './utils/index';
import Events       from './Events';
import filter       from './Filter';

window._.noConflict();

var isPhantom = /PhantomJS/.test(window.navigator.userAgent);
if (isPhantom) {
  require('bdd/utils/phantom-shims');
}

var ui = new UI();

var BDD = {
  $           : $,
  chai        : require('chai'),
  _           : require('underscore'),
  FeatureTree : FeatureTree,
  Feature     : Feature,
  Scenario    : Scenario,
  World       : World,
  Universe    : Universe,
  StepRecord  : StepRecord,
  StepFunction: StepFunction,
  Events      : Events,
  start       : init,
  ui          : ui,
  utils       : utils,
  bind        : utils.bind,
  queryParams : utils.queryParams(),
  // filter      : new Filter()
  filter      : filter
};

BDD.CONFIGS = {
  promiseTimeout: 1000
};

window['BDD'] = BDD;

var loadTests = require('bdd/loaders/load-tests-amd');

BDD.tree = loadTests();

var useTestem = typeof Testem !== 'undefined';
var testemAdapter;
if (useTestem) {
  testemAdapter = require('bdd/testem/testem-adapter');
  testemAdapter.start();
}

ui.setupPage();

setTimeout(function() {
  init().then(function() {
    if (testemAdapter) {
      testemAdapter.end();
    }

    ui.cleanUp();
  });  
});
