export default function throwError(msg) {
  debugger;
  
  if (typeof msg !== 'string') {
    debugger;
  }
  var error = new Error(msg);
  // if (Obey.tests.currentStep) {
  //   Obey.tests.currentStep.log.push(error);
  if (Obey.activeTest) {
    Obey.activeTest.log.push(error);
  } else {
    throw error;
  }
}