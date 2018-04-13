'use strict';
var vscode = require('vscode');

var ExtraInfoSupport = (function () {
    function ExtraInfoSupport(client) {
        this.client = client;
    }
    ExtraInfoSupport.prototype.provideHover = function (document, position, token) {
        var args = {
            file: this.client.asAbsolutePath(document.uri),
            line: position.line + 1,
            offset: position.character + 1
        };
        if (!args.file) {
            return Promise.resolve(null);
        }
        return this.client.execute('quickinfo', args, token).then(function (response) {
            var data = response.body;
            if (data) {
                return new vscode.Hover([data.documentation, { language: 'objectpascal', value: data.displayString }], new vscode.Range(data.start.line - 1, data.start.offset - 1, data.end.line - 1, data.end.offset - 1));
            }
        }, function (err) {
            return null;
        });
    };
    return ExtraInfoSupport;
})();
exports.default = ExtraInfoSupport;
//# sourceMappingURL=extraInfoSupport.js.map