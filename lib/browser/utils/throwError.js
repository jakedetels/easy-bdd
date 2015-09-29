export default function throwError(msg) {
  if (typeof msg !== 'string') {
    debugger;
  }
  var error = new Error(msg);
  if (BDD.tests.currentStep) {
    BDD.tests.currentStep.log.push(error);
  } else {
    throw error;
  }
}