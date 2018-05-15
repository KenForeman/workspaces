'use strict';

var WireProtocol = require('./features/utils/wireProtocol');
var vscode = require('vscode');
var cp = require('child_process');
var path = require('path');
var fs = require('fs');

    var isWin = /^win/.test(process.platform);
    var isDarwin = /^darwin/.test(process.platform);
    var isLinux = /^linux/.test(process.platform);
    var arch = process.arch;
    var ObjectPascalServiceClient = (function() {
        function ObjectPascalServiceClient(host) {
            this.host = host;
            this.pathSeparator = path.sep;
            this.servicePromise = null;
            this.lastError = null;
            this.sequenceNumber = 0;
            this.exitRequested = false;
            this.firstStart = Date.now();
            this.numberRestarts = 0;
            this.requestQueue = [];
            this.pendingResponses = 0;
            this.callbacks = Object.create(null);
            this.startService();
        }
        Object.defineProperty(ObjectPascalServiceClient.prototype, "trace", {
            get: function () {
                return ObjectPascalServiceClient.Trace;
            },
            enumerable: true,
            configurable: true
        });
        ObjectPascalServiceClient.prototype.service = function () {
            if (this.servicePromise) {
                return this.servicePromise;
            }
            if (this.lastError) {
                return Promise.reject(this.lastError);
            }
            this.startService();
            return this.servicePromise;
        };
        ObjectPascalServiceClient.prototype.startService = function (resendModels) {
            var _this = this;
            if (resendModels === void 0) { resendModels = false; }
            this.servicePromise = new Promise(function (resolve, reject) {
                          
                var childProcess = null;  
                try {     
                    var config = vscode.workspace.getConfiguration('omnipascal');  

                    var deveEnvPath = "";
                    var DevEnv = config.get('defaultDevelopmentEnvironment', '');
                    if (DevEnv == "FreePascal")
                        deveEnvPath = config.get('freePascalSourcePath', '');    
                    else
                        deveEnvPath = config.get('delphiInstallationPath', '');
                    
                    if (typeof deveEnvPath == 'undefined')
                        deveEnvPath = "";                    
                    var searchPath = config.get('searchPath', '');                                                                
                    if (typeof searchPath == 'undefined')
                        searchPath = "";                     
                    var workspacePath = vscode.workspace.rootPath;
                    if (typeof workspacePath == 'undefined') {
                        var filePath = vscode.workspace.textDocuments[0].fileName;
                        workspacePath = path.dirname(filePath);
                    }                         
                                                
                    if (isWin) {
                        childProcess = cp.spawn(path.join(__dirname, 'bin/win/OmniPascalServer.exe'), [workspacePath, deveEnvPath, searchPath]);
                    }
                    else if (isDarwin) {
                        var binFile = path.join(__dirname, 'bin/mac/OmniPascalServer');
                        fs.chmod(binFile, '755');
                        childProcess = cp.spawn(binFile, [workspacePath, deveEnvPath, searchPath]);
                    }
                    else if (isLinux && arch === 'x64') {
                        var binFile = path.join(__dirname, 'bin/linux/x64/OmniPascalServer')
                        fs.chmod(binFile, '755');
                        childProcess = cp.spawn(binFile, [workspacePath, deveEnvPath, searchPath]);
                    }
                    else {
                        childProcess = cp.fork(workspacePath, [], {
                            silent: true
                        });
                    }
                    childProcess.on('error', function (err) {
                        _this.lastError = err;
                        _this.serviceExited();
                    });
                    childProcess.on('exit', function (err) {
                        _this.serviceExited();
                    });
                    /*
                    childProcess.stdout.on('data', function (data) {
                        
                        try {
                            var msg = JSON.parse(data);
                            _this.dispatchMessage(msg);
                        } catch (error) {
                            //nothing
                            throw new Error(error);
                        }                         
                    });    */

                    _this.reader = new WireProtocol.Reader(childProcess.stdout, function (msg) {
                        _this.dispatchMessage(msg);
                    });
                    resolve(childProcess);
                }
                catch (error) {
                    reject(error);
                }
            });
            this.serviceStarted(resendModels);
        };
        ObjectPascalServiceClient.prototype.serviceStarted = function (resendModels) {
            if (resendModels) {
                this.host.populateService();
            }
            var config = vscode.workspace.getConfiguration('omnipascal');
            this.execute('setConfig', config);            
        };
        ObjectPascalServiceClient.prototype.serviceExited = function (restart) {
            var _this = this;
            this.servicePromise = null;
            Object.keys(this.callbacks).forEach(function (key) {
                _this.callbacks[parseInt(key)].e(new Error('Service died.'));
            });
            this.callbacks = Object.create(null);
            if (!this.exitRequested && restart) {
                var diff = Date.now() - this.lastStart;
                this.numberRestarts++;
                if (this.numberRestarts > 5) {
                    if (diff < 60 * 1000 /* 1 Minutes */) {
                        vscode.window.showWarningMessage('The OmniPascal language service died unexpectedly 5 times in the last 5 Minutes. Please consider to open a bug report.');
                    }
                    else if (diff < 2 * 1000 /* 2 seconds */) {
                        vscode.window.showErrorMessage('The OmniPascal language service died 5 times right after it got started. The service will not be restarted. Please open a bug report.');
                    }
                }
                this.startService(true);
            }
        };
        ObjectPascalServiceClient.prototype.asAbsolutePath = function (resource) {
            if (resource.scheme !== 'file') {
                return null;
            }
            var result = resource.fsPath;
            // Both \ and / must be escaped in regular expressions
            return result ? result.replace(new RegExp('\\' + this.pathSeparator, 'g'), '/') : null;
        };
        ObjectPascalServiceClient.prototype.asUrl = function (filepath) {
            return vscode.Uri.file(filepath);
        };
        ObjectPascalServiceClient.prototype.execute = function (command, args, expectsResultOrToken, token) {
            var _this = this;
            var expectsResult = true;
            if (typeof expectsResultOrToken === 'boolean') {
                expectsResult = expectsResultOrToken;
            }
            else {
                token = expectsResultOrToken;
            }
            var request = {
                seq: this.sequenceNumber++,
                type: 'request',
                command: command,
                arguments: args
            };
            var requestInfo = {
                request: request,
                promise: null,
                callbacks: null
            };
            var result = null;
            if (expectsResult) {
                result = new Promise(function (resolve, reject) {
                    requestInfo.callbacks = { c: resolve, e: reject, start: Date.now() };
                    if (token) {
                        token.onCancellationRequested(function () {
                            _this.tryCancelRequest(request.seq);
                            var err = new Error('Canceled');
                            err.message = 'Canceled';
                            reject(err);
                        });
                    }
                });
            }
            requestInfo.promise = result;
            this.requestQueue.push(requestInfo);
            this.sendNextRequests();
            return result;
        };
        ObjectPascalServiceClient.prototype.sendNextRequests = function () {
            while (this.pendingResponses === 0 && this.requestQueue.length > 0) {
                this.sendRequest(this.requestQueue.shift());
            }
        };
        ObjectPascalServiceClient.prototype.sendRequest = function (requestItem) {
            var _this = this;
            var serverRequest = requestItem.request;
            if (ObjectPascalServiceClient.Trace) {
                console.log('ObjectPascal Service: sending request ' + serverRequest.command + '(' + serverRequest.seq + '). Response expected: ' + (requestItem.callbacks ? 'yes' : 'no') + '. Current queue length: ' + this.requestQueue.length);
            }
            if (requestItem.callbacks) {
                this.callbacks[serverRequest.seq] = requestItem.callbacks;
                this.pendingResponses++;
            }
            this.service().then(function (childProcess) {
                childProcess.stdin.write(JSON.stringify(serverRequest) + '\r\n', 'utf8');
            }).catch(function (err) {
                var callback = _this.callbacks[serverRequest.seq];
                if (callback) {
                    callback.e(err);
                    delete _this.callbacks[serverRequest.seq];
                    _this.pendingResponses--;
                }
            });
        };
        ObjectPascalServiceClient.prototype.tryCancelRequest = function (seq) {
            for (var i = 0; i < this.requestQueue.length; i++) {
                if (this.requestQueue[i].request.seq === seq) {
                    this.requestQueue.splice(i, 1);
                    if (ObjectPascalServiceClient.Trace) {
                        console.log('ObjectPascal Service: canceled request with sequence number ' + seq);
                    }
                    return true;
                }
            }
            if (ObjectPascalServiceClient.Trace) {
                console.log('ObjectPascal Service: tried to cancel request with sequence number ' + seq + '. But request got already delivered.');
            }
            return false;
        };
        ObjectPascalServiceClient.prototype.dispatchMessage = function (message) {
            try {
                if (message.type === 'response') {
                    var response = message;
                    var p = this.callbacks[response.request_seq];
                    if (p) {
                        if (ObjectPascalServiceClient.Trace) {
                            console.log('ObjectPascal Service: request ' + response.command + '(' + response.request_seq + ') took ' + (Date.now() - p.start) + 'ms. Success: ' + response.success);
                        }
                        delete this.callbacks[response.request_seq];
                        this.pendingResponses--;
                        if (response.success) {
                            p.c(response);
                        }
                        else {
                            if((typeof response.body !== 'undefined') && (response.body != ""))
                                vscode.window.showErrorMessage(response.body);
                            p.e(response);
                        }
                    }
                }
                else if (message.type === 'event') {
                    var event = message;
                    if (event.event === 'syntaxDiag') {
                        this.host.syntaxDiagnosticsReceived(event);
                    }
                    if (event.event === 'semanticDiag') {
                        this.host.semanticDiagnosticsReceived(event);
                    }
                }
                else {
                    throw new Error('Unknown message type ' + message.type + ' recevied');
                }
            }
            finally {
                this.sendNextRequests();
            }
        };
        ObjectPascalServiceClient.Trace = false;
        return ObjectPascalServiceClient;
    })();
    
exports.ObjectPascalServiceClient = ObjectPascalServiceClient;    

//# sourceMappingURL=objectpascalServiceClient.js.map