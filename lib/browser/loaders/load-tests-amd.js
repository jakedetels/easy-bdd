import BDD from 'BDD';
// import FeatureTree from '../models/feature-tree/FeatureTree';

export default function loadTestsAMD() {
  var require = window.requirejs;
  var entries = require.entries;  
  var directory = '<<__ROOT_MODULE__>>';
  var tree = new BDD.FeatureTree(directory);
  // var tree = new FeatureTree(directory);  
  var moduleName, filePath, fileExport;
  var moduleNamePattern = new RegExp('^.*(-feature$|steps$|world$)');

  window.BDD_files = {}; // for debugging only

  for (moduleName in entries) {
    if ( ! moduleName.match(moduleNamePattern)) { continue; }
    
    filePath = moduleName;
    fileExport = require(moduleName);
    fileExport = fileExport['default'] || fileExport;
    tree.addToTree(filePath, fileExport);

    window.BDD_files[filePath] = fileExport;
  }

  return tree; 
}