const fs = require('fs')
const EOL = require('./Constants').EOL

const FileWriter = function() {
}

FileWriter.prototype.write = function(filePath, encoding, lines, transformer, options) {
  let fileContent = ''
  if (fs.existsSync(filePath)) {
    fileContent = fs.readFileSync(filePath, encoding);
  }

  const valueToInsert = this.getTransformedLines(lines, transformer)

  const output = transformer.insert(fileContent, valueToInsert, options)

  writeFileAndCreateDirectoriesSync(filePath, output, 'utf8')
}

//https://gist.github.com/jrajav/4140206
const writeFileAndCreateDirectoriesSync = function(filepath, content, encoding) {
  const mkpath = require('mkpath')
  const path = require('path')

  const dirname = path.dirname(filepath)
  mkpath.sync(dirname)

  fs.writeFileSync(filepath, content, encoding)
}

//

const FakeWriter = function() {

}

FileWriter.prototype.getTransformedLines = function(lines, transformer) {
  // let valueToInsert = ''
  // for (let i = 0; i < lines.length; i++) {
  //   const line = lines[i]

  //   if (!line.isEmpty()) {
  //     if (line.isComment()) {
  //       const transformed = transformer.transformComment(line.getComment())

  //       if (transformed !== null) {
  //         valueToInsert += transformed

  //         if (i !== lines.length - 1) {
  //           valueToInsert += EOL
  //         }
  //       }
  //     } else {
  //       valueToInsert += transformer.transformKeyValue(line.getKey(), line.getValue())

  //       if (i !== lines.length - 1) {
  //         valueToInsert += EOL
  //       }
  //     }
  //   }
  // }

  // return valueToInsert
    var valueToInsert = transformer.empty();
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var skipLine = false;
        if (line.hasData()) {
            var newValue = null
            if (line.isComment()) {
                newValue = transformer.transformComment(line.getComment());
            } else {
                newValue = transformer.transformKeyValue(line.getKey(), line.getValue());
            }
            valueToInsert = appendValueTo(valueToInsert, newValue);
            skipLine = newValue == null
        }

        if (!skipLine && (line.hasData() || line.isEmpty())) {
            valueToInsert = appendValueTo(valueToInsert, EOL);
        }
    }

  return valueToInsert;
}

FakeWriter.prototype.write = function(filePath, lines, transformer) {

}

module.exports = { File: FileWriter, Fake: FakeWriter }


function appendValueTo(container, value) {
    if (value == null) {
        /* Do nothing. */
    } else if (typeof container == 'string') {
        container += value
    } else if (typeof container == 'object') {
        container.push(value)
    }
    return container
}


