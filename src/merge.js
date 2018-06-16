const _ = require('lodash');
/**
 * Returns a merger that recurs over the provided types.
 * 
 * @param {[string]} diveIntoTypes some types returned from typeof to recur over
 */
function merge(diveIntoTypes) {
  /**
   * Merge the key value pairs from parent to child - recursively (ie. fn({a: true}, {}); // child = {a: true}). Honors
   * Overrides in child object (ie. fn({a: true}, {a: false}); // child = {a: false})
   * 
   * @param {JSON} parent 
   * @param {JSON} child 
   * @param {[string]} parentKeys
   */
  function innerMerge (parent, child, [key, ...tail] = Object.keys(parent)){
    if (!key && tail.length === 0) return;
    const childValue = child[key];
    const parentValue = parent[key];
    const supportedType = (bool, val) =>
      _.some(diveIntoTypes, (type) => bool && type === typeof val);
    if (!childValue) {
      child[key] = parentValue;
    } else if (_.isArray(parent) && _.isArray(child)) {
      parent.forEach((pv) => {
        if (!child.find((cv) => cv === pv)) {
          child.push(pv);
        }
      });
    } else if (parentValue &&
      childValue !== parentValue &&
      [parentValue, childValue].reduce(supportedType)) {
        innerMerge(parentValue, childValue);
    }
    innerMerge(parent, child, tail);
  };
  return innerMerge;
}
module.exports = merge;