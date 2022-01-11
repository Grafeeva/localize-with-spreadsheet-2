const GSReader = require('./core/LineReader.js').GS;
const FileWriter = require('./core/Writer.js').File;
const Transformer = require('./core/Transformer.js');

const Gs2File = function(reader, writer) {
  this._reader = reader
  this._writer = writer
  this._lines = []

}

Gs2File.fromGoogleSpreadsheet = async function(apiKey, spreadsheetKey, sheets) {
  const reader = await GSReader.builder(apiKey, spreadsheetKey, sheets)

  return new Gs2File(
    reader,
    new FileWriter()
  )
}

Gs2File.prototype.setValueCol = function(valueCol) {
  this._defaultValueCol = valueCol
}

Gs2File.prototype.setKeyCol = function(keyCol) {
  this._defaultKeyCol = keyCol
}

Gs2File.prototype.setFormat = function(format) {
  this._defaultFormat = format
}

Gs2File.prototype.setEncoding = function(encoding) {
  this._defaultEncoding = encoding
}

Gs2File.prototype.save = async function(outputPath, opts) {
  console.log('saving ' + outputPath)
  console.log('save ' + outputPath)
  const self = this

  opts = opts || {}

  let keyCol = opts.keyCol
  let valueCol = opts.valueCol
  let format = opts.format
  let encoding = opts.encoding

  if (!keyCol) {
    keyCol = this._defaultKeyCol
  }

  if (!valueCol) {
    valueCol = this._defaultValueCol
  }

  if (!format) {
    format = this._defaultFormat
  }

  if (!encoding) {
    encoding = this._defaultEncoding
    if (!encoding) {
      encoding = 'utf8'
    }
  }

  const lines = await this._reader.select(keyCol, valueCol)

  if (lines) {
    const transformer = Transformer[format || 'android']
    self._writer.write(outputPath, encoding, lines, transformer, opts)
  }
}


Gs2File.prototype.appendAndSave = async function (outputPath, opts, cb) {
    console.log('saving ' + outputPath)
    var self = this;

    opts = opts || {};

    var keyCol = opts.keyCol,
        valueCol = opts.valueCol;

    if (!keyCol) {
        keyCol = this._defaultKeyCol;
    }

    if (!valueCol) {
        valueCol = this._defaultValueCol;
    }

    this._reader.select(keyCol, valueCol).then(function (lines) {
        if (lines) {
            self._lines = self._lines.concat(lines)
        }

        self.saveLines(lines, outputPath);
    });

}

Gs2File.prototype.saveLines = async function (lines, outputPath, opts, cb) {
    var self = this;

    console.log('saving ' + outputPath);

    opts = opts || {};

    var format = opts.format,
        encoding = opts.encoding;

    if (!format) {
        format = this._defaultFormat;
    }

    if(!encoding) {
        encoding = this._defaultEncoding;
        if(!encoding) {
            encoding = 'utf8';
        }
    }

    if (lines) {
        var transformer = Transformer[format || 'ios'];
        self._writer.write(outputPath, encoding, lines, transformer, opts);
    }

    if (typeof(cb) == 'function') {
        cb();
    }
}

module.exports = Gs2File
