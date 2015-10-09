export default function throwError(msg) {
  debugger;
  
  if (typeof msg !== 'string') {
    debugger;
  }
  var error = new Error(msg);
  // if (BDD.tests.currentStep) {
  //   BDD.tests.currentStep.log.push(error);
  if (BDD.activeTest) {
    BDD.activeTest.log.push(error);
  } else {
    throw error;
  }
}