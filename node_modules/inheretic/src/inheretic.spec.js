describe('inheretic', () => {
  const fs = require('fs');
  const path = require('path');
  const index = require('./inherit');

  beforeAll(() => {
    try{ fs.mkdirSync('./tmp'); } catch(x) {}
    require('fs-extra').copySync('example-app', './tmp');
  });
  beforeEach(index.cache._clear);
  afterEach(index.cache._clear);
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
      index.chainInherit({'/child': {child: child, parent: parent}}, fs.writeFileSync, '');
      expect(index.inherit).toHaveBeenCalledWith(parent, child, fs.writeFileSync);
    });
    describe('when order may matter', () => {
      const parent = {pk:'pv', _filename: '/parent'};
      const child = {ck:'cv', _filename: '/child', parent: '/parent'};
      const grandchild = {gk:'gv', _filename: '/grandchild', parent: '/child'};
      function assertInheritanceEldestFirst(families){
        const callOrder = []
        index.inherit = (parent, child) => callOrder.push({
          parent:parent, child:child
        });
        index.chainInherit(families(parent, child, grandchild), () => {}, '');
        expect([
          {parent: parent, child: child},
          {parent: child,  child: grandchild}
        ]).toEqual(callOrder);
      }
      it('inherits from parent -> child -> grandchild', () => {
        assertInheritanceEldestFirst((parent, child, grandchild) => {
          return {
            '/child': {child: child, parent: parent},
            '/grandchild': {child: grandchild, parent: child}
          };
        });
      });
      it('inherits from parent -> child -> grandchild - compliment', () => {
        assertInheritanceEldestFirst((parent, child, grandchild) => {
          return {
            '/grandchild': {child: grandchild, parent: child},
            '/child': {child: child, parent: parent}
          };
        });
      });
    });
  });

  describe('packageToFamily', () => {
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
      const packageToFamily = index.packageToFamily('', fileSystem({
        '/child': '{"parent":"/parent"}', 
        '/parent': '{"ya":"buddy"}'
      }));
      expect([{parent: {ya:'buddy', _filename: '/parent'},
               child: {parent:'/parent', _filename: path.resolve('/child')}}])
        .toEqual(packageToFamily(path.resolve('/child')));
    });
    it('returns [] if no parent', () => {
      const packageToFamily = index.packageToFamily('', fileSystem({
        '/child': '{"yoyoyo":"boyeeeeee"}',
        '/parent': '{"ya":"buddy"}'
      }));
      expect([]).toEqual(packageToFamily(path.resolve('/child')));
    });
  });

});
