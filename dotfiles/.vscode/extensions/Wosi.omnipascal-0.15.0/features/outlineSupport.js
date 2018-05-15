/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var vscode = require('vscode');
var PConst = require('../protocol.const');

    var outlineTypeTable = Object.create(null);
    outlineTypeTable[PConst.Kind.module] = vscode.SymbolKind.Module;
    outlineTypeTable[PConst.Kind.class] = vscode.SymbolKind.Class;
    outlineTypeTable[PConst.Kind.enum] = vscode.SymbolKind.Enum;
    outlineTypeTable[PConst.Kind.interface] = vscode.SymbolKind.Interface;
    outlineTypeTable[PConst.Kind.memberFunction] = vscode.SymbolKind.Method;
    outlineTypeTable[PConst.Kind.memberVariable] = vscode.SymbolKind.Property;
    outlineTypeTable[PConst.Kind.memberGetAccessor] = vscode.SymbolKind.Property;
    outlineTypeTable[PConst.Kind.memberSetAccessor] = vscode.SymbolKind.Property;
    outlineTypeTable[PConst.Kind.variable] = vscode.SymbolKind.Variable;
    outlineTypeTable[PConst.Kind.const] = vscode.SymbolKind.Variable;
    outlineTypeTable[PConst.Kind.localVariable] = vscode.SymbolKind.Variable;
    outlineTypeTable[PConst.Kind.variable] = vscode.SymbolKind.Variable;
    outlineTypeTable[PConst.Kind.function] = vscode.SymbolKind.Function;
    outlineTypeTable[PConst.Kind.localFunction] = vscode.SymbolKind.Function;
    outlineTypeTable[PConst.Kind.struct] = vscode.SymbolKind.Struct;
    outlineTypeTable[PConst.Kind.type] = vscode.SymbolKind.Property;
    function textSpan2Range(value) {
        return new vscode.Range(value.start.line - 1, value.start.offset - 1, value.end.line - 1, value.end.offset - 1);
    }
    var OutlineSupport = (function () {
        function OutlineSupport(client) {
            this.client = client;
        }
        OutlineSupport.prototype.provideDocumentSymbols = function (resource, token) {
            var args = {
                file: this.client.asAbsolutePath(resource.uri)
            };
            if (!args.file) {
                return Promise.resolve([]);
            }
            function convert(bucket, item, containerLabel) {
                var result = new vscode.SymbolInformation(item.text, outlineTypeTable[item.kind] || vscode.SymbolKind.Package, textSpan2Range(item.spans[0]), resource.uri, containerLabel);
                if (item.childItems && item.childItems.length > 0) {
                    for (var _i = 0, _a = item.childItems; _i < _a.length; _i++) {
                        var child = _a[_i];
                        convert(bucket, child, result.name);
                    }
                }
                bucket.push(result);
            }
            return this.client.execute('navbar', args, token).then(function (response) {
                if (response.body) {
                    var result = [];
                    response.body.forEach(function (item) { return convert(result, item); });
                    return result;
                }
            }, function (err) {
                return [];
            });
        };
        return OutlineSupport;
    })();
exports.default = OutlineSupport;
//# sourceMappingURL=outlineSupport.js.map