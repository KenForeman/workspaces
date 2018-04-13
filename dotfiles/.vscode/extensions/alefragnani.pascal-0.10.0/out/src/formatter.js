"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fs = require("fs");
const cp = require("child_process");
const os = require("os");
const npath = require("path");
/*

linux:
    "pascal.formatter.engine": "ptop",
    "pascal.formatter.enginePath": "/usr/bin/ptop",

*/
class Formatter {
    constructor(_document, _options) {
        this._document = _document;
        this._options = _options;
        this._options = this._options || {
            insertSpaces: false,
            tabSize: 2
        };
        if (typeof this._options.insertSpaces === 'undefined') {
            this._options.insertSpaces = false;
            this._options.tabSize = 2;
        }
        if (typeof this._options.tabSize != 'number' || isNaN(this._options.tabSize)) {
            this._options.tabSize = 2;
        }
        this._options.tabSize = Math.max(0, 2);
    }
    format(range, engine, path, parameters, indent, wrapLineLength) {
        return new Promise((resolve, reject) => {
            // entire document - if not range is provided
            range = range || new vscode.Range(0, 0, this._document.lineCount, this._document.lineAt(this._document.lineCount - 1).range.end.character);
            let textToFormat = this._document.getText(range);
            let tempFile = npath.join(os.tmpdir(), 'tmp.tmp.pas');
            let command;
            let tempFileOut = npath.join(os.tmpdir(), 'tmp.tmp.out');
            let configFileParameters = '';
            fs.writeFileSync(tempFile, textToFormat);
            if (textToFormat) {
                try {
                    // 
                    if (engine == 'ptop') {
                        if (parameters != '') {
                            configFileParameters = ' -c ' + parameters;
                        }
                        let indentConfig = '';
                        if (indent > 0) {
                            indentConfig = ' -i ' + indent;
                        }
                        let wrapLineLengthConfig = '';
                        if (wrapLineLength > 0) {
                            wrapLineLengthConfig = ' -l ' + wrapLineLength;
                        }
                        command = "\"" + path + "\" " + configFileParameters + indentConfig + wrapLineLengthConfig + ' \"$file\" \"$outfile\" ';
                        command = command.replace('$file', tempFile);
                        command = command.replace('$outfile', tempFileOut);
                    }
                    else {
                        if (parameters != '') {
                            configFileParameters = ' -config=' + parameters;
                        }
                        command = "\"" + path + "\" " + configFileParameters + '  -y -F \"$file\" ';
                        command = command.replace('$file', tempFile);
                    }
                    console.log(command);
                    cp.exec(command, function (error, stdout, stderr) {
                        console.log('stdout' + stdout);
                        console.log('error' + error);
                        console.log('stderr' + stderr);
                        if (error) {
                            reject(stdout.toString());
                        }
                        else {
                            let formattedXml = fs.readFileSync(tempFileOut, 'utf8');
                            resolve(formattedXml);
                            ;
                        }
                    });
                }
                catch (err) {
                    reject(err.toString());
                }
            }
            else {
                reject('no text to format');
            }
        });
    }
}
exports.Formatter = Formatter;
//# sourceMappingURL=formatter.js.map