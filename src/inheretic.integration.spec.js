describe('inherit', () => {
  const cleanupTmp = true;
  const fs = require('fs');
  
  function ioFactory(ioFn){
    const io = ioFn();
    io.reader.pkg = io.reader('package.json');
    io.reader.template = io.reader('template.package.json');
    return io;
  }

  function time(label, lambda, start = new Date()){
    try{
      const obj = lambda();
      console.log(`'${label}' took: ${(new Date().getTime() - start.getTime()) / 1000}s.`);
      return obj;
    } catch (x) {
      console.log(`'${label}' died in: ${(new Date().getTime() - start.getTime()) / 1000}s.`);
      console.error(x);
      throw x;
    }
  }

  function main(writer){
    return () => {
      const cwd = process.cwd;
      try {
        process.cwd = __dirname;
        require('./inherit').cache._clear();
        require('./inherit')('tmp', writer, 'template.package.json');
      } finally {
        process.cwd = cwd;
      }
    };
  }

  
  beforeEach(() => {
    time('copy example-app -> tmp', () => {
      try { fs.mkdirSync('./tmp'); } catch (x) {}
      require('fs-extra').copySync('example-app', './tmp');
    });
  });

  afterEach((done) => {
    const startTime = new Date();
    const doneFn = () => { 
      time('rm -rf tmp', () => {}, startTime);
      done();
    }
    cleanupTmp ? require('rimraf')('./tmp', doneFn) : doneFn();
  });

  [() => { return {
    name: 'disk',
    writer: fs.writeFileSync, 
    reader: (fileName) => {
      return (moduleName) => {
        const path = `./tmp/packages/node_modules/${moduleName}/${fileName}`;
        if(fs.existsSync(path)){
          return fs.readFileSync(path, { encoding: 'utf8' });
        }
      };
    }
  };}, () => {
    const ReportIO = require('./report-io');
    const reportIo = new ReportIO();
    reportIo.name = 'report';
    return reportIo;
  }].forEach((ioFn) => {

    it(' - ' + ioFn().name + ' - does nothing if module doesn\'t specify parent', () => {
      const io = ioFactory(ioFn);
      const noParentName = 'child-no-parent';
      expect(io.reader.pkg(noParentName)).toBe(undefined);
      const template = io.reader.template('child-no-parent');
      time('main', main(io.writer));
      expect(io.reader.template(noParentName)).toEqual(template);
      expect(io.reader.pkg(noParentName)).toBe(undefined);
    });
  
    it(' - ' + ioFn().name + ' - inserts attributes from parent in child module\'s children', () => {
      const io = ioFactory(ioFn);
      const exampleAppJson = fs.readFileSync(`./tmp/package.json`, { encoding: 'utf8' });
      const exampleAppDevDependencies = JSON.parse(exampleAppJson).devDependencies;
      exampleAppDevDependencies.gulp = "^3.9.1";
      expect(io.reader.pkg('child-leaf')).toBe(undefined);
      time('main', main(io.writer));
      expect(exampleAppDevDependencies).toEqual(
        JSON.parse(io.reader.pkg('child-leaf')).devDependencies
      );
    });
  
    it(' - ' + ioFn().name + ' - copies attributes from parent to child module', () => {
      const io = ioFactory(ioFn);
      expect(io.reader.pkg('child-siblings')).toBe(undefined);
      expect(io.reader.pkg('child-leaf')).toBe(undefined);
      expect(JSON.parse(io.reader.template('child-leaf')).version).toBe(undefined);
      time('main', main(io.writer));
      const siblingsJson = io.reader.pkg('child-siblings');
      const siblingsVersion = JSON.parse(siblingsJson).version;
      expect(JSON.parse(io.reader.pkg('child-leaf')).version).toEqual(siblingsVersion);
    });
  
    it(' - ' + ioFn().name + ' - allows children to override properties', () => {
      const io = ioFactory(ioFn);
      const exampleAppJson = fs.readFileSync(`./tmp/package.json`, { encoding: 'utf8' });
      const exampleAppVersion = JSON.parse(exampleAppJson).version;
      expect(exampleAppVersion).toEqual("0.0.0");
      expect(io.reader.pkg('child-root')).toBe(undefined);
      time('main', main(io.writer));
      expect(JSON.parse(io.reader.pkg('child-root')).version).toEqual("0.1.3");
    });
  
    it(' - ' + ioFn().name + ' - allows children to override object property', () => {
      const io = ioFactory(ioFn);
      const exampleAppJson = fs.readFileSync(`./tmp/package.json`, { encoding: 'utf8' });
      const exampleAppDevDependencies = JSON.parse(exampleAppJson).devDependencies;
      expect(exampleAppDevDependencies).toEqual({jasmine: "~3.1.0"});
      expect(io.reader.pkg('child-siblings-twin')).toBe(undefined);
      time('main', main(io.writer));
      expect(JSON.parse(io.reader.pkg('child-siblings-twin')).devDependencies).toEqual({jasmine: "3.0.0"});
    });
  });
  
});
