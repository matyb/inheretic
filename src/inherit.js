const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const diveIntoTypes = ['object', 'function'];
const merge = require('./merge')(diveIntoTypes);
const cache = {_keyFn: (file) => path.resolve(file.replace(/\\/g, "/"))};

cache._clear = () => Object.keys(cache).forEach((key) => {
    if(key !== '_keyFn' && key !== '_clear'){
        delete cache[key];
    }
});

const fileToJson = (file, fileSystem = fs) => {
    const key = cache._keyFn(file);
    return cache[key] || (() => {
        const json = JSON.parse(fileSystem.readFileSync(key));
        cache[key] = json;
        return fileToJson(key, fileSystem);
    })();
};

const inherit = (parent, child, writer = fs.writeFileSync) => {
    if(!child._generated){
        merge(parent, child);
        const clone = _.cloneDeep(child);
        delete clone._filename;
        delete clone._generated;
        const fileName = cache._keyFn(path.join(path.dirname(child._filename), "package.json"));
        writer(fileName, JSON.stringify(clone, null, 4));
        child._generated = true;
        cache[fileName] = child;
        console.log(`Wrote: '${fileName}' successfully.`);
    } 
};

function chainInherit(families, writer, packageName, [key, ...tail] = Object.keys(families)){
    const family = families[key];
    if(family){
        if(family.parent && family.parent._filename){
            const parentDir = path.dirname(family.parent._filename);
            const parentFamilies = [families[path.resolve(parentDir, path.basename(family.parent._filename))],
                                    families[path.resolve(parentDir, packageName)]].filter( x => x );
            _.uniq(parentFamilies).forEach((parentFamily) => {
                const index = tail.indexOf(parentFamily.child._filename);
                if(index > -1){
                    (function swap(array, x, y){ // todo array.prototype, lib?
                        let tmp = array[x];
                        array[x] = array[y];
                        array[y] = tmp;
                    }(tail, index, 0));
                }
                module.exports.chainInherit(families, writer, packageName, tail);
                family.parent = parentFamily.child;
                tail.splice(0, 1);
            });
        }
        module.exports.inherit(family.parent, family.child, writer);
        module.exports.chainInherit(families, writer, packageName, tail);
    }
}
function packageToFamily(packageName, fileSystem = fs) {
    return (package) => {
        const parsed = fileToJson(package, fileSystem);
        parsed._filename = path.resolve(package);
        if(parsed.parent){
            function findParent(package, parent){
              parent = path.resolve(path.dirname(package), parent);
              if (fileSystem.existsSync(parent)) {
                return parent;
              }
            }
            // TODO use path basename/dirname
            // TODO refactor the parents like u did in the array parentFamilies
            const lastFileSep = parsed.parent.replace(/\\/g, "/").lastIndexOf('/');
            const originalParent = parsed.parent.substring(lastFileSep + 1);
            const intendedParent = findParent(package, parsed.parent);
            const failSafeParent = findParent(package, parsed.parent.substring(0, lastFileSep + 1) + packageName);
            const parent = intendedParent || failSafeParent;
            if(parent){
                const json = fileToJson(parent, fileSystem);
                json._filename = path.resolve(path.dirname(parent), originalParent);
                const results = [{child: parsed, parent: json}];
                if(path.resolve(json._filename) !== path.resolve(parent)){
                    const clone = _.clone(json);
                    clone._filename = path.resolve(path.dirname(package), parent);
                    results.push({child: parsed, parent: clone});
                } 
                return results;
            } else {
                console.warn(`Unable to locate parent at path: '${parent}'`);
            }
        } else {
            console.warn(`Package found at '${path.resolve(package)}' but specifies no parent.`);
        }
        return [];
    };
}
function inheretic(parent, writer, packageName = 'package.json'){
    parent = path.join(process.cwd + '/../', parent);
    console.log(`Seeking '${packageName}' within: ${parent}`);
    const families = _.flatMap(require('./find-files')(parent, packageName), 
                               module.exports.packageToFamily(packageName))
                      .reduce((obj, family) => {
                          obj[family.child._filename] = family;
                          return obj;
                      }, {});
    module.exports.chainInherit(families, writer, packageName);
}
module.exports = inheretic;
module.exports.diveIntoTypes = diveIntoTypes;
module.exports.inherit = inherit;
module.exports.chainInherit = chainInherit;
module.exports.packageToFamily = packageToFamily;
module.exports.cache = cache;