'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const abstractProvider_1 = require("./abstractProvider");
class PascalDocumentSymbolProvider extends abstractProvider_1.AbstractProvider {
    parseDocumentSymbolLocation(output) {
        var items = new Array();
        output.split(/\r?\n/)
            .forEach(function (value, index, array) {
            if (value != null && value != "") {
                let values = value.split(/ +/);
                let className = '';
                let methodName = '';
                let tag = values.shift();
                let line = parseInt(values.shift()) - 1;
                let filePath = values.shift();
                let kindStr = values.shift();
                let kind;
                if (tag.indexOf('.') > 0) {
                    className = tag.substr(1, tag.indexOf('.') - 1);
                    methodName = tag.substring(tag.indexOf('.') + 1);
                }
                else {
                    methodName = tag;
                    kind = vscode.SymbolKind.Interface;
                }
                if ((kindStr == 'constructor') || (kindStr == 'destructor')) {
                    kind = vscode.SymbolKind.Constructor;
                }
                else {
                    kind = kind || vscode.SymbolKind.Method;
                }
                let rest = values.join(' ');
                let symbolInfo = new vscode.SymbolInformation(methodName, kind, new vscode.Range(line, 0, line, 0), undefined, className);
                items.push(symbolInfo);
            }
        });
        return items;
    }
    documentSymbolLocations(filename) {
        return new Promise((resolve, reject) => {
            this.generateTagsIfNeeded(filename)
                .then((value) => {
                if (value) {
                    // discover
                    let p = cp.execFile('global', ['-f', filename], { cwd: abstractProvider_1.AbstractProvider.basePathForFilename(filename) }, (err, stdout, stderr) => {
                        try {
                            if (err && err.code === 'ENOENT') {
                                console.log('The "global" command is not available. Make sure it is on PATH');
                            }
                            if (err)
                                return resolve(null);
                            let result = stdout.toString();
                            let decls = this.parseDocumentSymbolLocation(result);
                            return resolve(decls);
                        }
                        catch (e) {
                            reject(e);
                        }
                    });
                }
                else {
                    return resolve(null);
                }
            });
        });
    }
    provideDocumentSymbols(document, token) {
        let fileName = document.fileName;
        return this.documentSymbolLocations(fileName).then(decls => {
            return decls;
        });
    }
}
exports.PascalDocumentSymbolProvider = PascalDocumentSymbolProvider;
//# sourceMappingURL=documentSymbolProvider.js.map