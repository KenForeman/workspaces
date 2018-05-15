var vscode_1 = require('vscode');

var AbstractProvider = (function () {
    function AbstractProvider(server) {
        this._server = server;
        this._disposables = [];
    }
    AbstractProvider.prototype.dispose = function () {
        while (this._disposables.length) {
            this._disposables.pop().dispose();
        }
    };
    return AbstractProvider;
})();
//Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AbstractProvider;
