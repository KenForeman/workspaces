'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const shell_quote_1 = require("shell-quote");
const vscode_1 = require("vscode");
const projectRoot = vscode_1.workspace.rootPath ? vscode_1.workspace.rootPath : '.';
function activate(context) {
    (() => __awaiter(this, void 0, void 0, function* () {
        const disposable = vscode_1.commands.registerCommand('extension.gitGrep', () => __awaiter(this, void 0, void 0, function* () {
            const query = yield vscode_1.window.showInputBox({ prompt: 'Please input search word.' });
            const command = shell_quote_1.quote(['git', 'grep', '-H', '-n', '-e', query]);
            const fetchItems = () => new Promise((resolve, reject) => {
                child_process_1.exec(command, { cwd: projectRoot, maxBuffer: 2000 * 1024 }, (err, stdout, stderr) => {
                    if (stderr) {
                        vscode_1.window.showErrorMessage(stderr);
                        return resolve([]);
                    }
                    const lines = stdout.split(/\n/).filter(l => l !== '');
                    if (!lines.length) {
                        vscode_1.window.showInformationMessage('There are no items.');
                        return resolve([]);
                    }
                    return resolve(lines.map(l => {
                        const [fullPath, line, ...desc] = l.split(':');
                        const path = fullPath.split('/');
                        return {
                            label: `${path[path.length - 1]} : ${line}`,
                            description: desc.join(':'),
                            detail: fullPath,
                            fullPath: l,
                        };
                    }));
                });
            });
            const options = { matchOnDescription: true };
            const item = yield vscode_1.window.showQuickPick(fetchItems(), options);
            if (!item)
                return;
            const [file, line] = item.fullPath.split(':');
            const doc = yield vscode_1.workspace.openTextDocument(projectRoot + '/' + file);
            yield vscode_1.window.showTextDocument(doc);
            vscode_1.window.activeTextEditor.selection = new vscode_1.Selection(~~line, 0, ~~line, 0);
            vscode_1.commands.executeCommand('cursorUp');
            context.subscriptions.push(disposable);
        }));
    }))().catch((error) => {
        vscode_1.window.showErrorMessage(error);
    });
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map