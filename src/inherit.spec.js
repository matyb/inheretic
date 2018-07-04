describe('inherit', () => {
  const fs = require('fs');
  const path = require('path');
  const index = require('./inherit');
  const _ = require('lodash');

  beforeAll(() => {
    try{ fs.mkdirSync('./tmp'); } catch(x) {}
    require('fs-extra').copySync('example-app', './tmp');
  });
  beforeEach(() => index.cache = require('./cache')());
  afterEach(() => index.cache = require('./cache')());
  afterAll((done) => {
    require('rimraf')('./tmp', done);
  });

  describe('inherit', () => {
    it('does nothing if child is already generated', () => {
      const child = {_generated: true};
      index.inherit(undefined, child);
      expect(child).toEqual({_generated: true});
    });
    it('writes out the merge of parent template onto child template, without _filename key', () => {
      const writer = {writer: () => {}};
      spyOn(writer, 'writer').and.returnValue(undefined);
      const index = require('proxyquire').noCallThru()('./inherit', {
        './merge' : (t) => (p, c) => {}
      });
      index.inherit({meh: 'whatever'},
                    {nothing_to_merge: true, _filename: 'whatever'},
                    writer.writer);
      expect(writer.writer).toHaveBeenCalledWith(
        path.resolve('package.json'), '{\n    "nothing_to_merge": true\n}');
    });
  });

  describe('chainInherit', () => {
    const inherit = index.inherit;
    afterAll(() => {
      index.inherit = inherit;
    });
    it('terminates', () => {
      expect(index.chainInherit({})).toBe(undefined);
    });
    it('inherits from parent to child', () => {
      const child = {ck:'cv', _filename: '/child', parent: '/parent'};
      const parent = {pk:'pv'};
      spyOn(index, 'inherit');
      index.chainInherit({'/child': {child: child, parent: parent}}, fs.writeFileSync);
      expect(index.inherit).toHaveBeenCalledWith(parent, child, fs.writeFileSync);
    });
    describe('when order may matter', () => {
      const parent = {pk:'pv', _filename: '/parent'};
      const child = {ck:'cv', _filename: '/child', parent: '/parent'};
      const grandchild = {gk:'gv', _filename: '/grandchild', parent: '/child'};
      describe('chainInherit', () => {
        function assertChainInheritInKeyOrder(families, expected){
          const inherited = []
          index.inherit = (parent, child) => inherited.push({
            parent:parent, child:child
          });
          index.chainInherit(families(parent, child, grandchild), () => {});
          expect(expected).toEqual(inherited);
        }
        it('inherits from parent -> child -> grandchild', () => {
          assertChainInheritInKeyOrder((parent, child, grandchild) => {
            return {
              '/child': {child: child, parent: parent},
              '/grandchild': {child: grandchild, parent: child}
            };
          }, [{parent: parent, child: child}, {parent: child,  child: grandchild}]);
        });
        it('inherits from parent -> child -> grandchild - compliment', () => {
          assertChainInheritInKeyOrder((parent, child, grandchild) => {
            return {
              '/grandchild': {child: grandchild, parent: child},
              '/child': {child: child, parent: parent}
            };
          }, [{parent: child,  child: grandchild}, {parent: parent, child: child}]);
        });
      });
    });
  });

  describe('numberOfHops', () => {
    const families = {
      '/some/grandkid' : {
        'parent' : {
          '_filename' : '/some/kid'
        }
      },
      '/some/kid' : {
        'parent' : {
          '_filename' : '/some/parent'
        }
      },
      '/some/parent' : {
        'parent' : {
          '_filename' : '/some/grandparent'
        }
      },
      '/some/grandparent' : {}
    };
    const countHops = index.numberOfHops(families);
    it('counts hops to root of tree', () => {
      expect(['/some/grandkid',
              '/some/kid',
              '/some/parent',
              '/some/grandparent'].map(countHops)).toEqual([3,2,1,0]);
    });
    it('counts hops to root of tree - compliment', () => {
      expect(['/some/grandparent',
              '/some/parent',
              '/some/kid',
              '/some/grandkid'].map(countHops)).toEqual([0,1,2,3]);
    });
  });

  describe('packageToFamily', () => {
    beforeEach(() => index.cache = require('./cache')());
    afterEach(() => index.cache = require('./cache')());
    function fileSystem(files) {
      Object.keys(files).forEach((file) => {
        const tmp = path.resolve(file);
        files[tmp] = files[file];
        if(file !== tmp) delete files[file];
      });
      function fileContents(file) {
        return files[path.resolve(file)];
      }
      return { readFileSync: fileContents, existsSync: fileContents };
    }
    it('creates the json for package.json and its parent if a template', () => {
      const packageToFamily = index.packageToFamily(fileSystem({
        '/child': `{"parent":"/parent"}`, 
        '/parent': '{"ya":"buddy"}'
      }));
      expect([{parent: {ya:'buddy', _filename: path.resolve('/parent')},
               child: {parent:'/parent', _filename: path.resolve('/child')}}])
        .toEqual(packageToFamily(path.resolve('/child')));
    });
    it('returns [] if no parent', () => {
      const packageToFamily = index.packageToFamily(fileSystem({
        '/child': '{"yoyoyo":"boyeeeeee"}',
        '/parent': '{"ya":"buddy"}'
      }));
      expect([]).toEqual(packageToFamily(path.resolve('/child')));
    });
  });

});
