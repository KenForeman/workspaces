"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const linter_1 = require("./linter");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    let linter = new linter_1.default();
    linter.activate(context.subscriptions);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map