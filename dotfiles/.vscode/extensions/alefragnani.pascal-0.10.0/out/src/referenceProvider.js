'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const path = require("path");
const abstractProvider_1 = require("./abstractProvider");
class PascalReferenceProvider extends abstractProvider_1.AbstractProvider {
    parseReferenceLocation(output, filename) {
        var items = new Array();
        output.split(/\r?\n/)
            .forEach(function (value, index, array) {
            if (value != null && value != "") {
                let values = value.split(/ +/);
                // Create           2583 DelphiAST.pas      Result := FStack.Peek.AddChild(TSyntaxNode.Create(Typ));
                let word = values.shift();
                let line = parseInt(values.shift()) - 1;
                let filePath;
                let rest = values.join(' ');
                let idxProc = rest.match(/(\w|\s)+.pas\s+/gi);
                filePath = rest.substr(0, rest.indexOf(idxProc[0]) + idxProc[0].length - 1);
                filePath = path.join(abstractProvider_1.AbstractProvider.basePathForFilename(filename), filePath);
                let definition = new vscode.Location(vscode.Uri.file(filePath), new vscode.Position(line, 0));
                items.push(definition);
            }
        });
        return items;
    }
    referenceLocations(word, filename) {
        return new Promise((resolve, reject) => {
            this.generateTagsIfNeeded(filename)
                .then((value) => {
                if (value) {
                    let p = cp.execFile('global', ['-rx', word], { cwd: abstractProvider_1.AbstractProvider.basePathForFilename(filename) }, (err, stdout, stderr) => {
                        try {
                            if (err && err.code === 'ENOENT') {
                                console.log('The "global" command is not available. Make sure it is on PATH');
                            }
                            if (err)
                                return resolve(null);
                            let result = stdout.toString();
                            // console.log(result);
                            let locs = this.parseReferenceLocation(result, filename);
                            return resolve(locs);
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
    provideReferences(document, position, context, token) {
        let fileName = document.fileName;
        let word = document.getText(document.getWordRangeAtPosition(position)).split(/\r?\n/)[0];
        return this.referenceLocations(word, fileName).then(locs => {
            return locs;
        });
    }
}
exports.PascalReferenceProvider = PascalReferenceProvider;
//# sourceMappingURL=referenceProvider.js.map