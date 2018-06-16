const fs = require('fs');
const path = require('path');
function findFiles(folder, fileName, packages = []){
    const files = fs.readdirSync(folder);
    files.forEach((file) => {
        const resolved = path.join(folder, file);
        const stats = fs.lstatSync(resolved);
        if(stats.isDirectory()){
            module.exports(resolved, fileName, packages);
        } 
        if (path.basename(file) === fileName) {
            packages.push(resolved);
        }
    });
    return packages;
}
module.exports = findFiles;