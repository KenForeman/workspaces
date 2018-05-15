'use strict';
     
var vscode = require('vscode');
var ExtraInfoSupport = require('./features/extraInfoSupport');
var OmniPascalCodeActionProvider = require('./features/codeActionProvider');
var DeclarationSupport = require('./features/declarationSupport');
var OutlineSupport = require('./features/outlineSupport');
var ParameterHintsSupport = require('./features/parameterHintsSupport');
var BufferSyncSupport = require('./features/bufferSyncSupport');
var SuggestSupport = require('./features/suggestSupport');
var Configuration = require('./features/configuration');
var ObjectPascalServiceClient = require('./objectPascalServiceClient'); 

    function activate(subscriptions) {    
        var MODE_ID_TS = 'objectpascal';                       
        var clientHost = new ObjectPascalServiceClientHost();
        var client = clientHost.serviceClient;
        registerSupports(MODE_ID_TS, clientHost, client, subscriptions);
    }

    exports.activate = activate;
    function registerSupports(modeID, host, client, subscriptions) {
        vscode.languages.registerHoverProvider(modeID, new ExtraInfoSupport.default(client));
        vscode.languages.registerDefinitionProvider(modeID, new DeclarationSupport.default(client));
        //vscode.languages.registerDocumentHighlightProvider(modeID, new OccurrencesSupport(client));
        //vscode.languages.registerReferenceProvider(modeID, new ReferenceSupport(client));
        vscode.languages.registerDocumentSymbolProvider(modeID, new OutlineSupport.default(client));
        vscode.languages.registerSignatureHelpProvider(modeID, new ParameterHintsSupport.default(client), '(', ',');
        //vscode.languages.registerRenameProvider(modeID, new RenameSupport(client));
        //vscode.languages.registerDocumentRangeFormattingEditProvider(modeID, new FormattingSupport(client));
        //vscode.languages.registerOnTypeFormattingEditProvider(modeID, new FormattingSupport(client), ';', '}', '\n');
        //vscode.languages.registerWorkspaceSymbolProvider(new NavigateTypeSupport(client, modeID));
        var codeActionProvider = new OmniPascalCodeActionProvider.default(client);
        vscode.languages.registerCodeActionsProvider(modeID, codeActionProvider);
        
        vscode.languages.setLanguageConfiguration(modeID, {    
            wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
            comments: {
                lineComment: '//',
                blockComment: ['(*', '*)']
            },
            brackets: [
                ['{', '}'],
                ['[', ']'],
                ['(', ')'],
                ['<', '>'],
                ['beign', 'end'],
            ],
            __electricCharacterSupport: {
                brackets: [
                    { tokenType: 'delimiter.curly.ts', open: '{', close: '}', isElectric: true },
                    { tokenType: 'delimiter.square.ts', open: '[', close: ']', isElectric: true },
                    { tokenType: 'delimiter.paren.ts', open: '(', close: ')', isElectric: true },
                    { tokentype: 'keyword.tag-begin', open: 'begin', close: 'end', isElectric: true},
                    { tokenType: 'delimiter.paren.ts', open: '<', close: '>', isElectric: true }
                ],
                docComment: { scope: 'comment.documentation', open: '/**', lineStart: ' * ', close: ' */' }
            },
            __characterPairSupport: {
                autoClosingPairs: [
                    { open: '{', close: '}' },
                    { open: '[', close: ']' },
                    { open: '(', close: ')' },
                    //{ open: 'begin', close: 'end' },
                    { open: '"', close: '"', notIn: ['string'] },
                    { open: '\'', close: '\'', notIn: ['string', 'comment'] }
                ]
            }                
        });
        
        host.addBufferSyncSupport(new BufferSyncSupport.default(client, modeID));
        // Register suggest support as soon as possible and load configuration lazily
        // TODO: Eventually support eventing on the configuration service & adopt here
        
        var suggestSupport = new SuggestSupport.default(client);
        vscode.languages.registerCompletionItemProvider(modeID, suggestSupport, '.');

        var statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, Number.MAX_VALUE - 1);
        statusBarItem.text = "OmniPascal: No project loaded";
        statusBarItem.tooltip = "Click to load a project";
        statusBarItem.command = "omnipascal.loadProject";
        statusBarItem.show();

        var loadProjCommand = vscode.commands.registerCommand('omnipascal.loadProject', () => {
            var currentFile = vscode.window.activeTextEditor.document.fileName;
            var args = {
                file: currentFile
            };

            return client.execute('getProjectFiles', args).then(function (response) {                      
                var projects = [];
                var body = response.body;
                for (var i = 0; i < body.length; i++) {
                    var element = body[i];
                    projects.push(element.typeLabel);
                }

                var projectsPromise = new Promise(
                    function(resolve, reject) {
                        return client.execute('getProjectFiles', args).then(function (response) {                      
                            var projects = [];
                            var body = response.body;
                            for (var i = 0; i < body.length; i++) {
                                var element = body[i];
                                var item = {
                                    description: element.typeLabel,
                                    detail: '',
                                    label: element.name
                                }

                                projects.push(item);
                            }
                            resolve(projects);
                        })
                    });                

                return vscode.window.showQuickPick(projectsPromise, {
                        matchOnDescription: true,
                        placeHolder: "Select the project you want to load"
                    })
                    .then(function (choice) {
                        if (!choice)
                            return 0; 
                        
                        var args = {
                            file: choice.description
                        }

                        return client.execute('loadProject', args).then(function (respone) { 
                            statusBarItem.text = args.file.replace(/^.*[\\\/]/, '');
                            statusBarItem.tooltip = args.file;
                            statusBarItem.show();
                            return 0;
                        });
                    });                       
            });                       
        });               

        var addUsesCommand =vscode.commands.registerCommand('omnipascal.addUses', () => {
            var currentFile = vscode.window.activeTextEditor.document.fileName;
            var args = {
                file: currentFile
            };

            return selectUsesSection(client, currentFile)
                .then(function (usesSection) {
                    if (!usesSection)
                        return 0;    

                    var unitsPromise = new Promise(
                        function(resolve, reject) {
                            return client.execute('getAllUnits', args).then(function (response) {                      
                                var units = [];
                                var body = response.body;
                                for (var i = 0; i < body.length; i++) {
                                    var element = body[i];
                                    units.push(element.name);
                                }
                                resolve(units);
                            })
                        });

                        return vscode.window.showQuickPick(unitsPromise, {
                                matchOnDescription: true,
                                placeHolder: "Select the unit you want to add"
                            })
                            .then(function (choice) {
                               if (!choice)
                                    return 0; 
                                
                               var args = {
                                   filename: currentFile,
                                   usesSection: usesSection,
                                   unitToAdd: choice
                               }

                               return client.execute('addUses', args).then(function (codeActionResponse) {
                                   return codeActionProvider.HandleCodeActionResponse(codeActionResponse)
                               });
                            });                       
                    });                       
                });
    
        subscriptions.push(loadProjCommand, addUsesCommand);

        var reloadConfig = function () {
            suggestSupport.setConfiguration(Configuration.load(modeID));
        };        
        vscode.workspace.onDidChangeConfiguration(function () {
            reloadConfig();
        });
        reloadConfig();
    }

    function selectUsesSection(client, currentFile) { 
        var args = {
            filename: currentFile
        } 

        return client.execute('getPossibleUsesSections', args).then(function (response) {
            var sections = response.body.sections;

            if (sections.length == 1)
                return sections[0];
            
            return vscode.window.showQuickPick(sections, {
                matchOnDescription: true,
                placeHolder: "Select the uses section"
            });
        }, () => 0);          
    }

    function selectProjectFile(client, currentFile) { 
        var args = {
            file: currentFile
        } 

        return client.execute('getProjectFiles', args).then(function (response) {
            var sections = response.body.sections;

            if (sections.length == 1)
                return sections[0];
            
            return vscode.window.showQuickPick(sections, {
                matchOnDescription: true,
                placeHolder: "Select the project file"
            });
        }, () => 0);      
    }

    var ObjectPascalServiceClientHost = (function () {
        function ObjectPascalServiceClientHost() {
            var _this = this;
            this.bufferSyncSupports = [];
            this.currentDiagnostics = vscode.languages.createDiagnosticCollection('objectpascal');
            var handleProjectCreateOrDelete = function () {
                _this.client.execute('reloadProjects', null, false);
                _this.triggerAllDiagnostics();
            };
            var handleProjectChange = function () {
                _this.triggerAllDiagnostics();
            };
            var watcher = vscode.workspace.createFileSystemWatcher('**/tsconfig.json');
            watcher.onDidCreate(handleProjectCreateOrDelete);
            watcher.onDidDelete(handleProjectCreateOrDelete);
            watcher.onDidChange(handleProjectChange);
            this.client = new ObjectPascalServiceClient.ObjectPascalServiceClient(this);
            this.syntaxDiagnostics = Object.create(null);
        }
        Object.defineProperty(ObjectPascalServiceClientHost.prototype, "serviceClient", {
            get: function () {
                return this.client;
            },
            enumerable: true,
            configurable: true
        });
        ObjectPascalServiceClientHost.prototype.addBufferSyncSupport = function (support) {
            this.bufferSyncSupports.push(support);
        };
        ObjectPascalServiceClientHost.prototype.triggerAllDiagnostics = function () {
            this.bufferSyncSupports.forEach(function (support) { return support.requestAllDiagnostics(); });
        };
        /* internal */ ObjectPascalServiceClientHost.prototype.populateService = function () {
            var _this = this;
            this.currentDiagnostics.clear();
            this.syntaxDiagnostics = Object.create(null);
            // See https://github.com/Microsoft/ObjectPascal/issues/5530
            vscode.workspace.saveAll(false).then(function (value) {
                var documents = vscode.workspace.textDocuments;
                documents.forEach(function (document) {
                    _this.serviceClient.execute('open', { file: document.fileName }, false);
                });
                var args = {
                    delay: 0,
                    files: documents.map(function (document) { return document.fileName; })
                };
                _this.serviceClient.execute('geterr', args, false);
            });
        };
        /* internal */ ObjectPascalServiceClientHost.prototype.syntaxDiagnosticsReceived = function (event) {
            var body = event.body;
            if (body.diagnostics) {
                var markers = this.createMarkerDatas(body.diagnostics);
                this.syntaxDiagnostics[body.file] = markers;
            }
        };
        /* internal */ ObjectPascalServiceClientHost.prototype.semanticDiagnosticsReceived = function (event) {
            var body = event.body;
            if (body.diagnostics) {
                var diagnostics = this.createMarkerDatas(body.diagnostics);
                var syntaxMarkers = this.syntaxDiagnostics[body.file];
                if (syntaxMarkers) {
                    delete this.syntaxDiagnostics[body.file];
                    diagnostics = syntaxMarkers.concat(diagnostics);
                }
                this.currentDiagnostics.set(vscode.Uri.file(body.file), diagnostics);
            }
        };
        ObjectPascalServiceClientHost.prototype.createMarkerDatas = function (diagnostics) {
            var result = [];
            for (var _i = 0; _i < diagnostics.length; _i++) {
              var diagnostic = diagnostics[_i];
                var start = diagnostic.start, end = diagnostic.end, text = diagnostic.text;
                var range = new vscode.Range(start.line - 1, start.offset - 1, end.line - 1, end.offset - 1);
                //result.push(new vscode.Diagnostic(range, text, diagnostic.severity));
                
                var diag = new vscode.Diagnostic(range, text, diagnostic.severity);
                diag.code = "A4711";
                result.push(diag);                
            }
            return result;
        };
        return ObjectPascalServiceClientHost;
    })();
// });
//# sourceMappingURL=objectpascalMain.js.map