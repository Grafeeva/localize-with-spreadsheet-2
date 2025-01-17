var Transformer = {
    empty: '',
    transformComment: null,
    transformKeyValue: null,
    insert: function (input, newValues) { /* merge newValues dans input selon la convention de la plateforme (utilisation d'un commentaire pour séparer ce qui est généré */
    }
};
var EOL = '\n';

var iOSTransformer = {
    empty: function() {
        return '';
    },
    transformComment: function (comment) {
        return "/* " + comment + ' */';
    },
    normalizeValue: function (value) {
        var normalizedValue = value.replace(/%newline%/gi, "\\n");

        /* The following is for SwiftGen compatibility.  All '%' shall be
        replaced with %%. */
        //normalizedValue = normalizedValue.replace(/%/g, "%%");

        /* Replace regular substitution patterns. */
        normalizedValue = normalizedValue.replace(/"/gi, '\\"');
        normalizedValue = normalizedValue.replace(/{(\d+\$)?}/gi, "%$1@");
        normalizedValue = normalizedValue.replace(/{(\d+\$)?d}/gi, "%$1d");

        return normalizedValue
    },
    transformKeyValue: function (key, value) {
        var pattern = '__';
        var patternIndex = key.indexOf(pattern);
        if (patternIndex >= 0) {
            var quantifier = key.substr(patternIndex + pattern.length, key.length);
            if (quantifier != 'other') {
                /* Ignore non-"other" plural strings. */
                return null;
            }
            key = key.substr(0, patternIndex);
        }

        var normalizedValue = iOSTransformer.normalizeValue(value);

        return '"' + key + '" = "' + normalizedValue + '";';
    },
    AUTOGENERATED_TAG: '/* AUTO-GENERATED */',
    insert: function (input, newValues) {
        if (!input) {
            input = '';
        }

        var generatedIndex = input.indexOf(iOSTransformer.AUTOGENERATED_TAG);
        if (generatedIndex >= 0) {
            input = input.substr(0, generatedIndex);
        }

        var output = input + iOSTransformer.AUTOGENERATED_TAG + EOL + newValues;

        return output;
    }
};

var iOSPluralsTransformer = {
    empty: function() {
        return [];
    },
    transformComment: function (comment) {
        return {};
    },
    indent: function(n) {
        return ' '.repeat(n*4);
    },
    normalizeValue: function (value) {
        var normalizedValue = value.replace(/%newline%/gi, "\\n");
        normalizedValue = normalizedValue.replace(/{(\d+\$)?}/gi, "%$1@");
        normalizedValue = normalizedValue.replace(/{(\d+\$)?d}/gi, "%$1d");
        normalizedValue = normalizedValue.replace(/'/gi, "\\'");
        normalizedValue = normalizedValue.replace(/&/gi, "&amp;");
        normalizedValue = normalizedValue.replace(/\u00A0/gi, "\\u00A0");
        normalizedValue = normalizedValue.replace(/<(.*?)>/gi, '%TAG_LT%$1%TAG_GT%');
        normalizedValue = normalizedValue.replace(/</gi, '&lt;');
        normalizedValue = normalizedValue.replace(/>/gi, '&gt;');
        normalizedValue = normalizedValue.replace(/%TAG_LT%/gi, '<');
        normalizedValue = normalizedValue.replace(/%TAG_GT%/gi, '>');
        normalizedValue = normalizedValue.replace(/(<.*?>)/gi, '<![CDATA[$1]]>');

        return normalizedValue
    },
    transformKeyValue: function (key, value) {
        var pattern = '__';
        var keyStripIndex = key.indexOf(pattern);
        if (keyStripIndex < 0) {
            return {};
        }
        var strippedKey = key.substr(0, keyStripIndex);
        var quantity = key.substr(keyStripIndex + pattern.length, key.length);

        var normalizedValue = iOSPluralsTransformer.normalizeValue(value)

        var spec = {key: strippedKey, quantity: quantity, value: normalizedValue}
        return spec
    },
    insert: function (input, newValues) {
        if (newValues.length == 0) {
            return ''
        }

        /* Compose a table of all values. */

        var translations = {}
        for (value of newValues) {
            if (value.key != undefined) {
                var translation = translations[value.key];
                if (translation != undefined) {
                    translation.values.push(value)
                } else {
                    translations[value.key] = {key: value.key, values: [value]}
                }
            }
        }

        /* Write the table. */
        var output = '<plist version="1.0">' + EOL;
        output += '<dict>' + EOL;

        /* Format specs. */
        for (key in translations) {
            var spec = translations[key]
            output += iOSPluralsTransformer.writeValue(spec.key, spec.values);
        }

        output += '</dict>' + EOL;
        output += '</plist>' + EOL;
        return output;
    },
    writeValue: function (key, specs) {
        var indent = iOSPluralsTransformer.indent;

        /* Key declaration. */
        var i1 = indent(1)
        var output = i1 + '<key>' + key + '</key>' + EOL;

        /* Key dict. */
        output += i1 + '<dict>' + EOL;

        var i2 = indent(2)
        output += i2 + '<key>NSStringLocalizedFormatKey</key>' + EOL;
        output += i2 + '<string>%#@variable@</string>' + EOL;
        output += i2 + '<key>variable</key>' + EOL;
        output += i2 + '<dict>' + EOL;

        var i3 = indent(3)
        output += i3 + '<key>NSStringFormatSpecTypeKey</key>' + EOL;
        output += i3 + '<string>NSStringPluralRuleType</string>' + EOL;
        output += i3 + '<key>NSStringFormatValueTypeKey</key>' + EOL;
        output += i3 + '<string>d</string>' + EOL;

        for (spec of specs) {
            output += i3 + '<key>' + spec.quantity + '</key>' + EOL;
            output += i3 + '<string>' + spec.value + '</string>' + EOL;
        }

        output += i2 + '</dict>' + EOL;
        output += i1 + '</dict>' + EOL;

        return output
    }
}

var androidTransformer = {
    empty: function() {
        return '';
    },
    transformComment: function (comment) {
        return "<!-- " + comment + " -->";
    },
    transformKeyValue: function (key, value) {
        var excludedPattern = '__';
        if (key.indexOf(excludedPattern) >= 0) {
            return null
        }

        var normalizedValue = value.replace(/%newline%/gi, "\\n");
        normalizedValue = normalizedValue.replace(/{(\d+\$)?}/gi, "%$1s");
        normalizedValue = normalizedValue.replace(/{(\d+\$)?d}/gi, "%$1d");
        normalizedValue = normalizedValue.replace(/'/gi, "\\'");
        normalizedValue = normalizedValue.replace(/%((?:\d+\$)[sdf])/gi, '%$1');
        normalizedValue = normalizedValue.replace(/%([sdf])/gi, '%#$$$1');
        normalizedValue = normalizedValue.replace(/&/gi, "&amp;");
        normalizedValue = normalizedValue.replace(/\u00A0/gi, "\\u00A0");
        normalizedValue = normalizedValue.replace(/([^\.]|^)(\.{3})([^\.]|$)/gi, '$1&#8230;$3');
        normalizedValue = normalizedValue.replace(/<(.*?)>/gi, '%TAG_LT%$1%TAG_GT%');
        normalizedValue = normalizedValue.replace(/</gi, '&lt;');
        normalizedValue = normalizedValue.replace(/>/gi, '&gt;');
        normalizedValue = normalizedValue.replace(/%TAG_LT%/gi, '<');
        normalizedValue = normalizedValue.replace(/%TAG_GT%/gi, '>');
        normalizedValue = normalizedValue.replace(/(<.*?>)/gi, '<![CDATA[$1]]>');
        normalizedValue = normalizedValue.replace(/(.*?)%(\d+\$)?@(.*?)/gi, "$1%$2s$3");

        var indent = ' '.repeat(4)
        var ouput = indent + '<string name="' + key + '"';
        if (normalizedValue.includes('%s')) {
            ouput += ' formatted="false"';
        }
        ouput += '>' + normalizedValue + '</string>';

        var currPos = 0, nbOcc = 1, newStr = "";
        while ((currPos = ouput.indexOf("%#$", currPos)) != -1) {
            ouput = setCharAt(ouput, currPos + 1, nbOcc);
            ++currPos;
            ++nbOcc;
        }

        return ouput;
    },
    AUTOGENERATED_TAG: '<!-- AUTO-GENERATED -->',
    insert: function (input, newValues) {
        var AUTOGENERATED_TAG = androidTransformer.AUTOGENERATED_TAG;

        if (!input) {
            input = '';
        }

        var output = '';
        var closeTagIndex = input.indexOf('</resources>');
        if (closeTagIndex < 0) {
            output = '<?xml version="1.0" encoding="utf-8"?>' + EOL;
            output += AUTOGENERATED_TAG + EOL;
            output += '<resources>' + EOL;
        } else {
            output = input.substr(0, closeTagIndex);
        }

        output += newValues + '</resources>';

        return output;
    }
};

var androidPluralsTransformer = {
    empty: function() {
        return [];
    },
    transformComment: function (comment) {
        return {};
    },
    indent: function(n) {
        var indentationLevel = 0
        return ' '.repeat((n + indentationLevel)*4);
    },
    normalizeValue: function (value) {
        var normalizedValue = value.replace(/%newline%/gi, "\\n");
        normalizedValue = normalizedValue.replace(/{(\d+\$)?}/gi, "%$1s");
        normalizedValue = normalizedValue.replace(/{(\d+\$)?d}/gi, "%$1d");
        normalizedValue = normalizedValue.replace(/'/gi, "\\'");
        normalizedValue = normalizedValue.replace(/%((?:\d+\$)[sdf])/gi, '%$1');
        normalizedValue = normalizedValue.replace(/%([sdf])/gi, '%#$$$1');
        normalizedValue = normalizedValue.replace(/&/gi, "&amp;");
        normalizedValue = normalizedValue.replace(/\u00A0/gi, "\\u00A0");
        normalizedValue = normalizedValue.replace(/([^\.]|^)(\.{3})([^\.]|$)/gi, '$1&#8230;$3');
        normalizedValue = normalizedValue.replace(/<(.*?)>/gi, '%TAG_LT%$1%TAG_GT%');
        normalizedValue = normalizedValue.replace(/</gi, '&lt;');
        normalizedValue = normalizedValue.replace(/>/gi, '&gt;');
        normalizedValue = normalizedValue.replace(/%TAG_LT%/gi, '<');
        normalizedValue = normalizedValue.replace(/%TAG_GT%/gi, '>');
        normalizedValue = normalizedValue.replace(/(<.*?>)/gi, '<![CDATA[$1]]>');
        normalizedValue = normalizedValue.replace(/(.*?)%(\d+\$)?@(.*?)/gi, "$1%$2s$3");

        var currPos = 0, nbOcc = 1, newStr = "";
        while ((currPos = normalizedValue.indexOf("%#$", currPos)) != -1) {
            normalizedValue = setCharAt(normalizedValue, currPos + 1, nbOcc);
            ++currPos;
            ++nbOcc;
        }

        return normalizedValue
    },
    transformKeyValue: function (key, value) {
        var pattern = '__';
        var keyStripIndex = key.indexOf(pattern);
        if (keyStripIndex < 0) {
            return {};
        }
        var strippedKey = key.substr(0, keyStripIndex);
        var quantity = key.substr(keyStripIndex + pattern.length, key.length);

        var normalizedValue = androidPluralsTransformer.normalizeValue(value)

        var spec = {key: strippedKey, quantity: quantity, value: normalizedValue}
        return spec
    },
    insert: function (input, newValues) {
        if (newValues.length == 0) {
            return ''
        }

        /* Compose a table of all values. */

        var translations = {}
        for (value of newValues) {
            if (value.key != undefined) {
                var translation = translations[value.key];
                if (translation != undefined) {
                    translation.values.push(value)
                } else {
                    translations[value.key] = {key: value.key, values: [value]}
                }
            }
        }

        /* Write the table. */
        var output = ''
        var closeTagIndex = input.indexOf('</resources>');
        if (closeTagIndex < 0) {
            output = '<?xml version="1.0" encoding="utf-8"?>' + EOL;
            output += androidPluralsTransformer.AUTOGENERATED_TAG + EOL;
            output += '<resources>' + EOL;
        } else {
            output = input.substr(0, closeTagIndex);
        }

        /* Format specs. */
        for (key in translations) {
            var spec = translations[key]
            output += androidPluralsTransformer.writeValue(spec.key, spec.values);
        }

        output += '</resources>';

        return output;
    },
    writeValue: function (key, specs) {
        var indent = androidPluralsTransformer.indent;

        /* Key declaration. */
        var i1 = indent(1);
        var output = i1 + '<plurals name="' + key + '">' + EOL;

        var i2 = indent(2);
        for (spec of specs) {
            output += i2 + '<item quantity="' + spec.quantity + '">'
                + spec.value + '</item>' + EOL;
        }

        output += i1 + '</plurals>' + EOL;

        return output
    },
    AUTOGENERATED_TAG: '<!-- AUTO-GENERATED -->',
};

var jsonTransformer = {
    empty: function() {
        return '';
    },
    transformComment: function (comment) {
        return "";
    },
    transformKeyValue: function (key, value) {
        var normalizedValue = value.replace(/%newline%/gi, "\\n");
        normalizedValue = normalizedValue.replace(/"/gi, '\\"');
        normalizedValue = normalizedValue.replace(/%([@df])/gi, '%$1');
        normalizedValue = normalizedValue.replace(/%s/gi, "%@");

        return '  "' + key + '" : "' + normalizedValue + '",';
    },
    AUTOGENERATED_TAG: '',
    insert: function (input, newValues, options) {
        newValues = newValues.substring(0, newValues.length - 1);

        var output = EOL +
                     '{' + EOL +
                     newValues + EOL
                     + '}';

        return output;
    }
};

var dartTransformer = {
    empty: function() {
        return '';
    },
    transformComment: function (comment) {
        return "  // " + comment;
    },
    transformKeyValue: function (key, value) {
        var normalizedValue = value.replace(/%newline%/gi, "\\n");
        normalizedValue = normalizedValue.replace(/"/gi, '\\"');
        normalizedValue = normalizedValue.replace(/%([@df])/gi, '%$1');
        normalizedValue = normalizedValue.replace(/%s/gi, "%@");

        return '  "' + key + '" : "' + normalizedValue + '",';
    },
    AUTOGENERATED_TAG: '// AUTO-GENERATED',
    insert: function (input, newValues, options) {
        if (!input) {
            input = '';
        }

        var generatedIndex = input.indexOf(dartTransformer.AUTOGENERATED_TAG);
        if (generatedIndex >= 0) {
            input = input.substr(0, generatedIndex);
        }

        var header = options && options.header ? options.header : '';
        var footer = options && options.footer ? options.footer : '';

        var output = input + dartTransformer.AUTOGENERATED_TAG + EOL +
            header +
            '{' + EOL +
            newValues + EOL
            + '};' + footer;

        return output;
    }
};

var dartTemplateTransformer = {
    empty: function() {
        return '';
    },
    transformComment: function (comment) {
        return "  // " + comment;
    },
    transformKeyValue: function (key, value) {
        var normalizedValue = value.replace(/%newline%/gi, "\\n");
        normalizedValue = normalizedValue.replace(/"/gi, '\\"');
        normalizedValue = normalizedValue.replace(/%([@df])/gi, '%$1');
        normalizedValue = normalizedValue.replace(/%s/gi, "%@");

        return '  String get ' + key + ' => get("' + key + '");';
    },
    AUTOGENERATED_TAG: '// AUTO-GENERATED',
    insert: function (input, newValues, options) {
        if (!input) {
            input = '';
        }

        var generatedIndex = input.indexOf(dartTemplateTransformer.AUTOGENERATED_TAG);
        if (generatedIndex >= 0) {
            input = input.substr(0, generatedIndex);
        }

        var className = options && options.className ? options.className : 'T';
        var header = options && options.header ? options.header : 'library core.t';
        var baseClass = options && options.baseClass ? options.baseClass : 'TranslationSet';

        var output = input + dartTemplateTransformer.AUTOGENERATED_TAG + EOL +
            header + EOL + EOL +
            'class ' + className + ' extends ' + baseClass + ' { ' + EOL + EOL +
            '  ' + className + '(values): super(values);' + EOL + EOL +
            newValues + EOL +
            '}';

        return output;
    }
};

//TODO: finish + testing
var dotNetTransformer = {
    empty: function() {
        return '';
    },
    transformComment: function(comment) {
        return androidTransformer.transformComment(comment);
    },

    transformKeyValue : function(key, value) {
        //TODO: normalize string + detect format (%s => {0})

         var output = '<data name="' + key + '" xml:space="preserve">' + EOL
                      + '   <value>' + value + '</value>' + EOL
                      +'</data>' + EOL;
    },
    AUTOGENERATED_TAG: '<!-- AUTO-GENERATED -->',
    insert: function (input, newValues) {
        //TODO: use auto-generated tag
        return dotNetHeader + EOL + newValues + '</root>';
    }
};


function setCharAt(str, index, chr) {
    if (index > str.length - 1) return str;
    return str.substr(0, index) + chr + str.substr(index + 1);
}


module.exports = {
  'ios':          iOSTransformer,
  'iosPlurals':   iOSPluralsTransformer,
  'android':      androidTransformer,
  'json':         jsonTransformer,
  'dart':         dartTransformer,
  'dartTemplate': dartTemplateTransformer,
  '.net':         dotNetTransformer
}


var dotNetHeader =
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<root>' +
    '  <xsd:schema id="root" xmlns="" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:msdata="urn:schemas-microsoft-com:xml-msdata">' +
    '    <xsd:import namespace="http://www.w3.org/XML/1998/namespace" />' +
    '    <xsd:element name="root" msdata:IsDataSet="true">' +
    '      <xsd:complexType>' +
    '        <xsd:choice maxOccurs="unbounded">' +
    '          <xsd:element name="metadata">' +
    '            <xsd:complexType>' +
    '              <xsd:sequence>' +
    '                <xsd:element name="value" type="xsd:string" minOccurs="0" />' +
    '              </xsd:sequence>' +
    '              <xsd:attribute name="name" use="required" type="xsd:string" />' +
    '              <xsd:attribute name="type" type="xsd:string" />' +
    '              <xsd:attribute name="mimetype" type="xsd:string" />' +
    '              <xsd:attribute ref="xml:space" />' +
    '            </xsd:complexType>' +
    '          </xsd:element>' +
    '          <xsd:element name="assembly">' +
    '            <xsd:complexType>' +
    '              <xsd:attribute name="alias" type="xsd:string" />' +
    '              <xsd:attribute name="name" type="xsd:string" />' +
    '            </xsd:complexType>' +
    '          </xsd:element>' +
    '          <xsd:element name="data">' +
    '            <xsd:complexType>' +
    '              <xsd:sequence>' +
    '                <xsd:element name="value" type="xsd:string" minOccurs="0" msdata:Ordinal="1" />' +
    '                <xsd:element name="comment" type="xsd:string" minOccurs="0" msdata:Ordinal="2" />' +
    '              </xsd:sequence>' +
    '              <xsd:attribute name="name" type="xsd:string" use="required" msdata:Ordinal="1" />' +
    '              <xsd:attribute name="type" type="xsd:string" msdata:Ordinal="3" />' +
    '              <xsd:attribute name="mimetype" type="xsd:string" msdata:Ordinal="4" />' +
    '              <xsd:attribute ref="xml:space" />' +
    '            </xsd:complexType>' +
    '          </xsd:element>' +
    '          <xsd:element name="resheader">' +
    '            <xsd:complexType>' +
    '              <xsd:sequence>' +
    '                <xsd:element name="value" type="xsd:string" minOccurs="0" msdata:Ordinal="1" />' +
    '              </xsd:sequence>' +
    '              <xsd:attribute name="name" type="xsd:string" use="required" />' +
    '            </xsd:complexType>' +
    '          </xsd:element>' +
    '        </xsd:choice>' +
    '      </xsd:complexType>' +
    '    </xsd:element>' +
    '  </xsd:schema>' +
    '  <resheader name="resmimetype">' +
    '    <value>text/microsoft-resx</value>' +
    '  </resheader>' +
    '  <resheader name="version">' +
    '    <value>2.0</value>' +
    '  </resheader>' +
    '  <resheader name="reader">' +
    '    <value>System.Resources.ResXResourceReader, System.Windows.Forms, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089</value>' +
    '  </resheader>' +
    '  <resheader name="writer">' +
    '    <value>System.Resources.ResXResourceWriter, System.Windows.Forms, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089</value>' +
    '  </resheader>';
