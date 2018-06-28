const fs = require('fs');
const path = require('path');
module.exports = function ReportIO(){
    var collection = () => {
      const results = [];
      fs.readdirSync(path.resolve('tmp/packages/node_modules/')).forEach(module => {
        const file = path.join('tmp/packages/node_modules/', module, 'template.package.json');
        results.push({file: path.resolve(file), contents: fs.readFileSync(file).toString()});
      });
      return results;
    };
    this.writer = function(fileName, contents) {
      if(typeof collection === 'function') {
        collection = collection();
      }
      collection.push({file: fileName, contents: contents});
    }
    this.reader = function(fileName) {
      return (moduleName) => {
        if(typeof collection === 'function') {
          collection = collection();
        }
        const absolutePath = path.join(__dirname.substring(0, __dirname.lastIndexOf('src')), 
                                      `tmp/packages/node_modules/${moduleName}/${fileName}`);
        const result = collection.find((entry) => entry.file === absolutePath);
        if(!result){
          console.log('NOTHING FOUND FOR: ', absolutePath, ' in ', collection.map(entry => entry.file));
        } else {
          return result.contents;
        }
      };
    }
  };