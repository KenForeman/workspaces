'use strict';
define(["require", "exports", 'vscode'], function (require, exports, vscode) {
    var ReferenceSupport = (function () {
        function ReferenceSupport(client) {
            this.tokens = [];
            this.client = client;
        }
        ReferenceSupport.prototype.provideReferences = function (document, position, options, token) {
            var _this = this;
            var args = {
                file: this.client.asAbsolutePath(document.uri),
                line: position.line + 1,
                offset: position.character + 1
            };
            if (!args.file) {
                return Promise.resolve([]);
            }
            return this.client.execute('references', args, token).then(function (msg) {
                var result = [];
                var refs = msg.body.refs;
                for (var i = 0; i < refs.length; i++) {
                    var ref = refs[i];
                    var url = _this.client.asUrl(ref.file);
                    var location = new vscode.Location(url, new vscode.Range(ref.start.line - 1, ref.start.offset - 1, ref.end.line - 1, ref.end.offset - 1));
                    result.push(location);
                }
                return result;
            }, function () {
                return [];
            });
        };
        return ReferenceSupport;
    })();
    return ReferenceSupport;
});
//# sourceMappingURL=referenceSupport.js.map