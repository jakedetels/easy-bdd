import Obey from 'Obey';

export default function loadTestsAMD() {
  var require = window.requirejs;
  var entries = require.entries;  
  var directory = '<<__ROOT_MODULE__>>';
  var tree = new Obey.FeatureTree(directory);
  var moduleNamePattern = new RegExp('^.*(-feature$|steps$|world$)');
  var moduleName, filePath, fileExport;

  window.Obey_files = {}; // for debugging only

  for (moduleName in entries) {
    if ( ! moduleName.match(moduleNamePattern)) { continue; }
    
    filePath = moduleName;
    fileExport = require(moduleName);
    fileExport = fileExport['default'] || fileExport;
    tree.addToTree(filePath, fileExport);

    window.Obey_files[filePath] = fileExport;
  }

  return tree; 
}