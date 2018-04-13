'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const cp = require("child_process");
const path = require("path");
const abstractProvider_1 = require("./abstractProvider");
class PascalDefinitionProvider extends abstractProvider_1.AbstractProvider {
    parseDefinitionLocation(output, filename) {
        var items = new Array();
        output.split(/\r?\n/)
            .forEach(function (value, index, array) {
            if (value != null && value != "") {
                let values = value.split(/ +/);
                // Create            113 C:/Users/alefr/Downloads/SynEdit-2_0_8/SynEdit/Source/SynURIOpener.pas constructor Create(AOwner: TComponent); override;
                let word = values.shift();
                let line = parseInt(values.shift()) - 1;
                // together again get the filename (which may contains spaces and the previous shift wouldn't work)
                let filePath;
                if (values[2].indexOf(word + '(') == 0) {
                    filePath = path.join(abstractProvider_1.AbstractProvider.basePathForFilename(filename), values.shift());
                }
                else {
                    let rest = values.join(' ');
                    let idxProc = rest.search(/(class\s+)?\b(procedure|function|constructor|destructor)\b/gi);
                    filePath = rest.substr(0, idxProc - 1);
                    filePath = path.join(abstractProvider_1.AbstractProvider.basePathForFilename(filename), filePath);
                }
                let definition = new vscode.Location(vscode.Uri.file(filePath), new vscode.Position(line, 0));
                items.push(definition);
            }
        });
        return items;
    }
    definitionLocations(word, filename) {
        return new Promise((resolve, reject) => {
            this.generateTagsIfNeeded(filename)
                .then((value) => {
                if (value) {
                    let p = cp.execFile('global', ['-x', word], { cwd: abstractProvider_1.AbstractProvider.basePathForFilename(filename) }, (err, stdout, stderr) => {
                        try {
                            if (err && err.code === 'ENOENT') {
                                console.log('The "global" command is not available. Make sure it is on PATH');
                            }
                            if (err)
                                return resolve(null);
                            let result = stdout.toString();
                            // console.log(result);
                            let locs = this.parseDefinitionLocation(result, filename);
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
    provideDefinition(document, position, token) {
        let fileName = document.fileName;
        let word = document.getText(document.getWordRangeAtPosition(position)).split(/\r?\n/)[0];
        return this.definitionLocations(word, fileName).then(locs => {
            return locs;
        });
    }
}
exports.PascalDefinitionProvider = PascalDefinitionProvider;
//# sourceMappingURL=definitionProvider.js.map