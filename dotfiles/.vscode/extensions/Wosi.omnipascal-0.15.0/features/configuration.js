'use strict';
var vscode = require('vscode');
    exports.defaultConfiguration = {
        useCodeSnippetsOnMethodSuggest: false
    };
    function load(myPluginId) {
        var configuration = vscode.workspace.getConfiguration(myPluginId);
        var useCodeSnippetsOnMethodSuggest = configuration.get('useCodeSnippetsOnMethodSuggest', exports.defaultConfiguration.useCodeSnippetsOnMethodSuggest);
        return {
            useCodeSnippetsOnMethodSuggest: useCodeSnippetsOnMethodSuggest
        };
    }
    exports.load = load;
//# sourceMappingURL=configuration.js.map