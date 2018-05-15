/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var vscode_1 = require('vscode');
var abstractProvider_1 = require('./abstractProvider');

    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    
    var GetActiveColumn = function (window) { 
        var currentEditor = window.activeTextEditor;
        var index = 0;
        var currentEditorIndex = 0;
        window.visibleTextEditors.forEach(function (editor) {
            //if (editor.document.fileName == currentEditor.document.fileName)
            if (editor == currentEditor)
                currentEditorIndex = index;
            index++;     
        }); 
        
        if (currentEditorIndex == 0)
            return vscode_1.ViewColumn.One;          
            
        if (currentEditorIndex == 1)
            return vscode_1.ViewColumn.Two;            
            
        if (currentEditorIndex == 2)
            return vscode_1.ViewColumn.Three;    
            
        return vscode_1.ViewColumn.One;             
    };  
    
    var ApplyEdit = function (editor, edit, response) {
        var result = vscode_1.workspace.applyEdit(edit);
        if ("resultingCursorPosition" in response.body) {
            var resultingCursorPosition = response.body.resultingCursorPosition;
            var newPosition = new vscode_1.Position(resultingCursorPosition.line - 1, resultingCursorPosition.offset - 1);
            editor.selection = new vscode_1.Selection(newPosition, newPosition);
            editor.revealRange(editor.selection, vscode_1.TextEditorRevealType.InCenter);
        }
        return result;
    };           

    var OmniPascalCodeActionProvider = (function (_super) {
        __extends(OmniPascalCodeActionProvider, _super);
        function OmniPascalCodeActionProvider(server) {            
            _super.call(this, server);
            this._commandId = 'omnipascal.runCodeAction';
            this._updateEnablement();
            var d1 = vscode_1.workspace.onDidChangeConfiguration(this._updateEnablement, this);
            var d2 = vscode_1.commands.registerCommand(this._commandId, this._runCodeAction, this);
            this._disposables.push(d1, d2);
        }
        OmniPascalCodeActionProvider.prototype._updateEnablement = function () {
            var value = false;
            this._disabled = value;
        };
        OmniPascalCodeActionProvider.prototype.provideCodeActions = function (document, range, context, token) {
            var _this = this;
            if (this._disabled) {
                return;
            }
            var req = {
                filename: document.fileName,
                selection: OmniPascalCodeActionProvider._asRange(range)
            };
            return this._server.execute('getCodeActions', req, token).then(function (response) {
                return response.body.CodeActions.map(function (ca) {
                    return {
                        title: ca.title,
                        command: _this._commandId,
                        arguments: [ca.command, document, range]
                    };
                });
            }, function (error) {
                return Promise.reject('Problem invoking \'GetCodeActions\' on OmniPascal server: ' + error);
            });
        };   
        OmniPascalCodeActionProvider.prototype._runCodeAction = function (id, document, range) {            
            var _this = this;
            var req = {
                filename: _this._server.asAbsolutePath(document.uri),
                selection: OmniPascalCodeActionProvider._asRange(range),
                identifier: id,
                wantsTextChanges: true
            };
            return this._server.execute('runCodeAction', req).then(function (response) {
                return _this.HandleCodeActionResponse(response);
            }, function (error) {
                return Promise.reject('Problem invoking \'RunCodeAction\' on OmniPascal server: ' + error);
            });
        };
        OmniPascalCodeActionProvider.prototype.HandleCodeActionResponse = function (response) { 
            if (response.success && Array.isArray(response.body.changes)) {
                var uri = null;
                var edit = new vscode_1.WorkspaceEdit();
                for (var _i = 0, _a = response.body.changes; _i < _a.length; _i++) {
                    var change = _a[_i];
                    uri = vscode_1.Uri.file(change.filePath);
                    var edits = [];
                    for (var _b = 0, _c = change.changes; _b < _c.length; _b++) {
                        var textChange = _c[_b];
                        var range = new vscode_1.Range(textChange.startLine - 1, textChange.startColumn - 1, textChange.endLine - 1, textChange.endColumn - 1);
                        edits.push(vscode_1.TextEdit.replace(range, textChange.insertString));                            
                    }
                    edit.set(uri, edits);
                }
                return vscode_1.workspace.openTextDocument(uri).then(function (document) {                      
                    if (document.uri.toString() == vscode_1.window.activeTextEditor.document.uri.toString()) {
                        return ApplyEdit(vscode_1.window.activeTextEditor, edit, response);
                    }
                    else {                      
                        var ActiveColumn = GetActiveColumn(vscode_1.window);                 
                        return vscode_1.window.showTextDocument(document, ActiveColumn).then(function (editor) {
                            return ApplyEdit(editor, edit, response)
                        });
                    }
                });
            }
        };

        OmniPascalCodeActionProvider._asRange = function (range) {
            var start = range.start, end = range.end;
            return {
                start: { line: start.line + 1, offset: start.character + 1 },
                end: { line: end.line + 1, offset: end.character + 1 }
            };
        };                
        return OmniPascalCodeActionProvider;
    })(abstractProvider_1.default);
    
exports.default = OmniPascalCodeActionProvider;
//# sourceMappingURL=codeActionProvider.js.map