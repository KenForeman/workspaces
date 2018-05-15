'use strict';

var vscode = require('vscode');
var Previewer = require('./previewer');
var PConst = require('../protocol.const');
var Configuration = require('./configuration');

var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};

    var MyCompletionItem = (function (_super) {
        __extends(MyCompletionItem, _super);
        function MyCompletionItem(entry) {
            _super.call(this, entry.name);
            this.sortText = "0";
            this.kind = MyCompletionItem.convertKind(entry.kind);
            this.detail = entry.typeLabel
        }
        MyCompletionItem.convertKind = function (kind) {
            switch (kind) {
                case PConst.Kind.primitiveType:
                case PConst.Kind.keyword:
                    return vscode.CompletionItemKind.Keyword;
                case PConst.Kind.variable:
                case PConst.Kind.localVariable:
                    return vscode.CompletionItemKind.Variable;
                case PConst.Kind.memberVariable:
                case PConst.Kind.memberGetAccessor:
                case PConst.Kind.memberSetAccessor:
                    return vscode.CompletionItemKind.Field;
                case PConst.Kind.function:
                case PConst.Kind.memberFunction:
                case PConst.Kind.constructSignature:
                case PConst.Kind.callSignature:
                case PConst.Kind.indexSignature:
                    return vscode.CompletionItemKind.Function;
                case PConst.Kind.enum:
                    return vscode.CompletionItemKind.Enum;
                case PConst.Kind.module:
                    return vscode.CompletionItemKind.Module;
                case PConst.Kind.class:
                    return vscode.CompletionItemKind.Class;
                case PConst.Kind.interface:
                    return vscode.CompletionItemKind.Interface;
            }
            return vscode.CompletionItemKind.Property;
        };
        return MyCompletionItem;
    })(vscode.CompletionItem);
    var SuggestSupport = (function () {
        function SuggestSupport(client) {
            this.triggerCharacters = ['.'];
            this.excludeTokens = ['string', 'comment', 'numeric'];
            this.sortBy = [{ type: 'reference', partSeparator: '/' }];
            this.client = client;
            this.config = Configuration.defaultConfiguration;
        }
        SuggestSupport.prototype.setConfiguration = function (config) {
            this.config = config;
        };

        function pad(num, size) {
            var s = num+"";
            while (s.length < size) s = "0" + s;
            return s;
        }

        SuggestSupport.prototype.provideCompletionItems = function (document, position, token) {
            var filepath = this.client.asAbsolutePath(document.uri);
            var args = {
                file: filepath,
                line: position.line + 1,
                offset: position.character + 1
            };
            if (!args.file) {
                return Promise.resolve([]);
            }
            return this.client.execute('completions', args, token).then(function (msg) {
                var completionItems = [];
                var body = msg.body;
                for (var i = 0; i < body.length; i++) {
                    var element = body[i];
                    var item = new vscode.CompletionItem(element.name, element.kind);
                    item.detail = element.typeLabel;
                    if (element.hasOwnProperty('snippet'))
                        item.insertText = new vscode.SnippetString(element.snippet);
                    item.sortText = pad(i, 10);
                    completionItems.push(item);
                }
                return completionItems;
            }, function (err) {
                return [];
            });
        };
        SuggestSupport.prototype.resolveCompletionItem = function (item, token) {
            // var _this = this;
            // if (item instanceof MyCompletionItem) {
            //     var args = {
            //         file: this.client.asAbsolutePath(item.document.uri),
            //         line: item.position.line + 1,
            //         offset: item.position.character + 1,
            //         entryNames: [item.label]
            //     };
            //     return this.client.execute('completionEntryDetails', args, token).then(function (response) {
            //         var details = response.body;
            //         if (details && details.length > 0) {
            //             var detail = details[0];
            //             item.documentation = Previewer.plain(detail.documentation);
            //             item.detail = Previewer.plain(detail.displayParts);
            //         }
            //         if (_this.config.useCodeSnippetsOnMethodSuggest && item.kind === vscode.CompletionItemKind.Function) {
            //             var codeSnippet = detail.name, suggestionArgumentNames;
            //             suggestionArgumentNames = detail.displayParts
            //                 .filter(function (part) { return part.kind === 'parameterName'; })
            //                 .map(function (part) { return ("{{" + part.text + "}}"); });
            //             if (suggestionArgumentNames.length > 0) {
            //                 codeSnippet += '(' + suggestionArgumentNames.join(', ') + '){{}}';
            //             }
            //             else {
            //                 codeSnippet += '()';
            //             }
            //             item.insertText = codeSnippet;
            //         }
            //         return item;
            //     }, function (err) {
            //         return item;
            //     });
            // }
        };
        return SuggestSupport;
    })();
    
    exports.default = SuggestSupport;

//# sourceMappingURL=suggestSupport.js.map