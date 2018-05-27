describe('inherit', () => {
  const fs = require('fs');
  beforeEach(() => {
    fs.mkdirSync('./tmp');
    require('fs-extra').copySync('example-app', './tmp');
  });
  afterEach((done) => {
    require('rimraf')('./tmp', done);
  });
  function readPackage(moduleName){
    return fs.readFileSync(`./tmp/packages/node_modules/${moduleName}/package.json`, { encoding: 'utf8' });
  }
  it('does nothing if module doesn\'t specify parent', () => {
    var readFile = () => readPackage('child-no-parent');
    const noParentJson = readFile();
    expect(noParentJson).toMatch('"name": "child-no-parent"');
    require('./index')();
    expect(noParentJson).toEqual(readFile());
  });
  it('copies attributes from parent to child module', () => {
    const childLeafJson = fs.readFileSync('./tmp/packages/node_modules/child-leaf/package.json', { encoding: 'utf8' });
    expect(childLeafJson).toMatch('"name": "child-leaf"');
    require('./index')();
    expect(childLeafJson).toMatch('"name": "example-app-child-leaf"');
  });
});
