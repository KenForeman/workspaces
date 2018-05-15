'use strict';
var vscode = require('vscode');
    var DeclartionSupport = (function () {
        function DeclartionSupport(client) {
            this.tokens = [];
            this.client = client;
        }
        DeclartionSupport.prototype.provideDefinition = function (document, position, token) {
            var _this = this;
            var args = {
                file: this.client.asAbsolutePath(document.uri),
                line: position.line + 1,
                offset: position.character + 1
            };
            if (!args.file) {
                return Promise.resolve(null);
            }
            return this.client.execute('definition', args, token).then(function (response) {
                var locations = response.body;
                if (!locations || locations.length === 0) {
                    return null;
                }
                return locations.map(function (location) {
                    var resource = _this.client.asUrl(location.file);
                    if (resource === null) {
                        return null;
                    }
                    else {
                        return new vscode.Location(resource, new vscode.Range(location.start.line - 1, location.start.offset - 1, location.end.line - 1, location.end.offset - 1));
                    }
                });
            }, function () {
                return null;
            });
        };
        return DeclartionSupport;
    })();
exports.default = DeclartionSupport;

//# sourceMappingURL=declarationSupport.js.map