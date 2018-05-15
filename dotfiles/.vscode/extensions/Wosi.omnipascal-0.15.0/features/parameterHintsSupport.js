'use strict';
var vscode = require('vscode');
var Previewer = require('./previewer');

    var ParameterHintsSupport = (function () {
        function ParameterHintsSupport(client) {
            this.client = client;
        }
        ParameterHintsSupport.prototype.provideSignatureHelp = function (document, position, token) {
            var args = {
                file: this.client.asAbsolutePath(document.uri),
                line: position.line + 1,
                offset: position.character + 1
            };
            if (!args.file) {
                return Promise.resolve(null);
            }
            return this.client.execute('signatureHelp', args, token).then(function (response) {
                var info = response.body;
                if (!info) {
                    return null;
                }
                var result = new vscode.SignatureHelp();
                result.activeSignature = info.selectedItemIndex;
                result.activeParameter = info.argumentIndex;
                info.items.forEach(function (item) {
                    var signature = new vscode.SignatureInformation('');
                    signature.label = item.name + '('; 
                    //signature.label += Previewer.plain(item.prefixDisplayParts);
                    item.parameters.forEach(function (p, i, a) {
                        var parameter = new vscode.ParameterInformation(p.label, p.documentation);
                        signature.label += p.label;
                        signature.parameters.push(parameter);
                        if (i < a.length - 1) {
                            signature.label += '; ';
                        }
                    });
                    signature.label += ')';
                    result.signatures.push(signature);
                });
                return result;
            }, function (err) {
                return null;
            });
        };
        return ParameterHintsSupport;
    })();
exports.default = ParameterHintsSupport;
//# sourceMappingURL=parameterHintsSupport.js.map