function traverseAndFlatten(currentNode, target, flattenedKey) {
    for (var key in currentNode) {
        if (currentNode.hasOwnProperty(key)) {
            var newKey;
            if (flattenedKey === undefined) {
                newKey = key;
            } else {
                newKey = flattenedKey + '.' + key;
            }

            var value = currentNode[key];
            if (typeof value === "object") {
                traverseAndFlatten(value, target, newKey);
            } else {
                target[newKey] = value;
            }
        }
    }
}

function flatten(obj) {
    var flattenedObject = {};
    traverseAndFlatten(obj, flattenedObject);
    return flattenedObject;
}

function diff(keys1, keys2) {
    return keys1.filter(function(i) {return keys2.indexOf(i) < 0;});
}

module.exports = {
    flatten,
    diff
};
