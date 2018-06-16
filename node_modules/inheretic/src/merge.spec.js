describe('merge', () => {
  const fs = require('fs');
  const path = require('path');
  const merge = require('./merge')(require('./inherit').diveIntoTypes);

  beforeAll(() => {
    try{fs.mkdirSync('./tmp');} catch(x) {}
    require('fs-extra').copySync('example-app', './tmp');
  });
  afterAll((done) => {
    require('rimraf')('./tmp', done);
  });

  describe('innerMerge', () => {
    it('merges property from parent to child if undefined in child', () => {
      const parent = {prop:'value'};
      const child = {};
      merge(parent, child);
      expect(child).toEqual(parent);
    });
    it('wont merge property from parent to child if defined in child', () => {
      const parent = {prop:'value'};
      const child = {prop:'overridden'};
      merge(parent, child);
      expect(child).toEqual({prop:'overridden'});
    });
    it('merges property from parent to child if nested in object within child', () => {
      const parent = {prop:{key1:'value1'}};
      const child = {prop:{key2:'value2'}};
      merge(parent, child);
      expect(child).toEqual({prop:{key2:'value2', key1:'value1'}});
    });
    it('merges property from parent to child if deeply nested in object within child', () => {
      const parent = {prop:{key:{nested1:'value1'}}};
      const child = {prop:{key:{nested2:'value2'}}};
      merge(parent, child);
      expect(child).toEqual({prop:{key:{nested2:'value2', nested1:'value1'}}});
    });
    it('wont merge property from parent to child if deeply nested in object within child and same key', () => {
      const parent = {prop:{key:{nested:'value1'}}};
      const child = {prop:{key:{nested:'value2'}}};
      merge(parent, child);
      expect(child).toEqual({prop:{key:{nested:'value2'}}});
    });
    it('merges array contents from parent to child if not contained in child array', () => {
      const parent = {prop:[0]};
      const child = {prop:[1]};
      merge(parent, child);
      expect(child).toEqual({prop:[1, 0]});
    });
    it('will not merge array contents from parent to child if contained in child array', () => {
      const parent = {prop:[0]};
      const child = {prop:[0]};
      merge(parent, child);
      expect(child).toEqual({prop:[0]});
    });
  });
});