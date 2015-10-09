export default Example;

function Example(headers, data) {
  this.headers = headers;
  
  this.data = data;

  this.test = {
    passed: true,
    status: 'passed',
    assertions: [],
    log: [],
    error: null
  };
}