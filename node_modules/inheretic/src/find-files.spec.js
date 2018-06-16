describe('findFiles', () => {
  const fs = require('fs');
  const path = require('path');
  const findFiles = require('./find-files');

  beforeAll(() => {
    fs.mkdirSync('./tmp');
    require('fs-extra').copySync('example-app', './tmp');
  });
  afterAll((done) => {
    require('rimraf')('./tmp', done);
  });

  describe('findFiles', () => {
    const parent = path.join(__dirname + '/../', 'tmp');
    it('finds package.json files', () => {
      const packages = findFiles(parent, 'package.json');
      expect(packages.length).toEqual(1);
      const pkg = packages[0].replace(/\\/g, '/'); // windows
      expect(pkg.endsWith("/tmp/package.json")).toBe(true);
    });
    it('finds template.package.json files', () => {
      const packages = findFiles(parent, 'template.package.json');
      expect(packages.length).toEqual(5);
      const pkgs = packages.map((pkg) => pkg.replace(/\\/g, '/')).sort(); // windows
      expect(pkgs[0].endsWith("/child-leaf/template.package.json")).toBe(true);
      expect(pkgs[1].endsWith("/child-no-parent/template.package.json")).toBe(true);
      expect(pkgs[2].endsWith("/child-root/template.package.json")).toBe(true);
      expect(pkgs[3].endsWith("/child-siblings-twin/template.package.json")).toBe(true);
      expect(pkgs[4].endsWith("/child-siblings/template.package.json")).toBe(true);
    });
  });
});