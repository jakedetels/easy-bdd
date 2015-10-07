var fs = require('fs');
var path = require('path');
var package = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
var easyBdd = require(path.join(__dirname, package.main));

// if (fs.existsSync('../easy-bdd')) {
//   easyBdd = require('../easy-bdd');
// } else if (fs.existsSync('node_modules/easy-bdd'))  {
//   easyBdd = require('easy-bdd');
// } else {
//   console.log('You need to run npm install');
//   return;
// }

easyBdd({
  // testsDirectory: 'tests',
  // appDirectory: 'lib/browser',
  appFiles: [
    'easy-bdd.js'
  ],
  modules: 'amd',
  moduleRoot: 'tests',
  moduleLoader: true
});