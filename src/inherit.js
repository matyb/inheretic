const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const diveIntoTypes = ['object', 'function'];
const merge = require('./merge')(diveIntoTypes);

var cache = require('./cache')()

const fileToJson = (file, fileSystem = fs) => {
    const key =  module.exports.cache._keyFn(file);
    return module.exports.cache[key] || (() => {
        const json = JSON.parse(fileSystem.readFileSync(key));
        module.exports.cache[key] = json;
        return fileToJson(key, fileSystem);
    })();
};

const inherit = (parent, child, writer = fs.writeFileSync) => {
    if(!child._generated){
        merge(parent, child);
        const clone = _.cloneDeep(child);
        delete clone._filename;
        delete clone._generated;
        const fileName = module.exports.cache._keyFn(path.join(path.dirname(child._filename), "package.json"));
        writer(fileName, JSON.stringify(clone, null, 4));
        child._generated = true;
        module.exports.cache[fileName] = child;
        console.log(`Wrote: '${fileName}' successfully.`);
    } 
};

function chainInherit(families, writer, keys = Object.keys(families), [key, ...tail] = keys){
    const family = families[key];
    if(family){
        module.exports.inherit(family.parent, family.child, writer);
        chainInherit(families, writer, tail);
    }
}
function packageToFamily(fileSystem = fs) {
    return (package) => {
        const parsed = fileToJson(package, fileSystem);
        parsed._filename = path.resolve(package);
        if(parsed.parent){
            const originalParent = path.basename(parsed.parent);
            const parent = path.resolve(path.dirname(package), parsed.parent);
            if(fileSystem.existsSync(parent)){
                const json = fileToJson(parent, fileSystem);
                json._filename = path.resolve(path.dirname(parent), originalParent);
                return [{child: parsed, parent: json}];
            } else {
                console.warn(`Unable to locate parent at path: '${parent}'`);
            }
        } else {
            console.warn(`Package found at '${path.resolve(package)}' but specifies no parent.`);
        }
        return [];
    };
}

function filesToFamilies(parent, packageName){
    console.log(`Seeking '${packageName}' within: ${parent}`);
    return _.flatMap(require('./find-files')(parent, packageName), 
                     module.exports.packageToFamily())
            .reduce((obj, family) => {
                obj[family.child._filename] = family;
                return obj;
            }, {});
}

function numberOfHops(families) {
    return function countHops(key) {
        return function internal(key, counter = 0){
            const child = families[key];
            key = child && child.parent && child.parent._filename;
            if(key) {
                return internal(key, ++counter);
            } else {
                const tmp = counter;
                counter = 0;
                return tmp;
            }
        }(key);
    };
}

function inheritCli(parent, writer, packageName = 'package.json'){
    const families = filesToFamilies(
        path.join(process.cwd(), parent) || path.resolve(parent), 
        packageName);
    module.exports.cache = require('./cache')();
    const sorted = _.sortBy(Object.keys(families), 
                            module.exports.numberOfHops(families));
    module.exports.chainInherit(families, writer, sorted);
}
module.exports = inheritCli;
module.exports.diveIntoTypes = diveIntoTypes;
module.exports.inherit = inherit;
module.exports.chainInherit = chainInherit;
module.exports.packageToFamily = packageToFamily;
module.exports.cache = cache;
module.exports.numberOfHops = numberOfHops;
module.exports.filesToFamilies = filesToFamilies;
