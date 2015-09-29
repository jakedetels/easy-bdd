export default function printStack(error) {
  if ( ! error instanceof Error) {
    throw new Error('printStack must be passed an Error instance.');
  }

  var stack = error.stack.replace(error, '');

  stack = BDD.utils.htmlEscape(stack);

  stack = stack
    .split('\n')
    .map( line => line.trim() )
    .filter( line => line !== '' );

  return stack;
}