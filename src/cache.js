const path = require('path');
module.exports = () => {
    const cache = {};
    cache._keyFn = (file) => path.resolve(file.replace(/\\/g, "/"));
    cache._clear = () => Object.keys(cache).forEach((key) => {
        if(key !== '_keyFn' && key !== '_clear'){
            delete cache[key];
        }
    });
    return cache;
};