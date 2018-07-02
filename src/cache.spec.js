describe('cache', () => {
    var cache;
    const _ = require('lodash');
    const path = require('path');
    beforeEach(() => cache = require('./cache')())
    afterEach(() => cache = require('./cache')());
    describe('_keyFn', () => {
        it('resolves full path', () => {
            expect(cache._keyFn('/yo/mama')).toEqual(path.resolve('/yo/mama'));
        });
    });
    describe('_clear', () => {
        it('clears cached data when called', () => {
            cache.yo = 'mama';
            cache._clear();
            expect(undefined).toBe(cache.yo);
        });
        it('preserves its own functions', () => {
            cache._clear();
            expect(["_keyFn", "_clear"]).toEqual(Object.keys(cache));
        });
    });
});