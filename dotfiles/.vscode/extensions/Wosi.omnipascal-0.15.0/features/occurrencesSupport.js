'use strict';
define(["require", "exports", 'vscode'], function (require, exports, vscode) {
    var OccurrencesSupport = (function () {
        function OccurrencesSupport(client) {
            this.client = client;
        }
        OccurrencesSupport.prototype.provideDocumentHighlights = function (resource, position, token) {
            var args = {
                file: this.client.asAbsolutePath(resource.uri),
                line: position.line + 1,
                offset: position.character + 1
            };
            if (!args.file) {
                return Promise.resolve([]);
            }
            return this.client.execute('occurrences', args, token).then(function (response) {
                var data = response.body;
                if (data) {
                    return data.map(function (item) {
                        return new vscode.DocumentHighlight(new vscode.Range(item.start.line - 1, item.start.offset - 1, item.end.line - 1, item.end.offset - 1), item.isWriteAccess ? vscode.DocumentHighlightKind.Write : vscode.DocumentHighlightKind.Read);
                    });
                }
            }, function (err) {
                return [];
            });
        };
        return OccurrencesSupport;
    })();
    return OccurrencesSupport;
});
//# sourceMappingURL=occurrencesSupport.js.map