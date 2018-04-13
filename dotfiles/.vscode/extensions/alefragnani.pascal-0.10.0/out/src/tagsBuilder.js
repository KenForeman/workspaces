'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cp = require("child_process");
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
var opener = require('opener');
class TagsBuilder {
    generateTags(basePath, update, showMessage) {
        return new Promise((resolve, reject) => {
            let command = update ? "global" : "gtags";
            let params = update ? "--update" : "";
            if (!TagsBuilder.tagsAvailable(path.join(basePath, 'GTAGS'))) {
                command = "gtags";
                params = "";
            }
            let statusBar = vscode.window.setStatusBarMessage("Generating tags...");
            let p = cp.execFile(command, [params], { cwd: basePath }, (err, stdout, stderr) => {
                try {
                    statusBar.dispose();
                    if (err && err.code === 'ENOENT') {
                        vscode.window.showInformationMessage('The ' + command + ' command is not available. Make sure it is on PATH');
                        resolve('The ' + command + ' command is not available. Make sure it is on PATH');
                        return;
                    }
                    if (err) {
                        vscode.window.showInformationMessage('Some error occured: ' + err);
                        resolve('Some error occured: ' + err);
                        return;
                    }
                    if (stderr) {
                        vscode.window.showInformationMessage('Some error occured: ' + stderr);
                        resolve('Some error occured: ' + stderr);
                        return;
                    }
                    if (showMessage) {
                        vscode.window.showInformationMessage('The tags where updated');
                    }
                    resolve("");
                    return;
                }
                catch (e) {
                    vscode.window.showInformationMessage('Some error occured: ' + e);
                    reject('Some error occured: ' + e);
                    return;
                }
            });
        });
    }
    static tagsAvailable(basePath) {
        return fs.existsSync(path.join(basePath, 'GTAGS'));
    }
    static checkGlobalAvailable(context) {
        return new Promise((resolve, reject) => {
            // test
            let p = cp.execFile('global', ['--help'], { cwd: vscode.workspace.rootPath }, (err, stdout, stderr) => {
                try {
                    // no error
                    if (!err) {
                        return resolve(true);
                    }
                    // error ?
                    if (err) {
                        if (err.code != 'ENOENT') {
                            return resolve(true);
                        }
                        // should ask?
                        let ask = context.globalState.get("askforGlobalAvailable", true);
                        if (!ask) {
                            return resolve(false);
                        }
                        let moreInfo = {
                            title: "More Info"
                        };
                        let dontShowAgain = {
                            title: "Don't show again"
                        };
                        vscode.window.showInformationMessage('The "global" command is not available. Make sure it is on PATH', moreInfo, dontShowAgain).then(option => {
                            if (typeof option === "undefined") {
                                return resolve(false);
                            }
                            if (option.title === "More Info") {
                                opener("https://github.com/alefragnani/vscode-language-pascal#code-navigation");
                                return resolve(false);
                            }
                            if (option.title === "Don't show again") {
                                context.globalState.update("askforGlobalAvailable", false);
                                return resolve(false);
                            }
                            return resolve(false);
                        });
                    }
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    }
}
exports.TagsBuilder = TagsBuilder;
//# sourceMappingURL=tagsBuilder.js.map