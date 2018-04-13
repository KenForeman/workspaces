'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const tagsBuilder_1 = require("./tagsBuilder");
class AbstractProvider {
    static basePathForFilename(filename) {
        let uriFilename = vscode.Uri.file(filename);
        let basePath = vscode.workspace.getWorkspaceFolder(uriFilename).uri.fsPath;
        return basePath;
    }
    generateTagsIfNeeded(filename) {
        return new Promise((resolve, reject) => {
            if (fs.existsSync(path.join(AbstractProvider.basePathForFilename(filename), "GTAGS"))) {
                resolve(true);
                return;
            }
            let autoGenerate = vscode.workspace.getConfiguration("pascal").get("tags.autoGenerate", true);
            if (!autoGenerate) {
                resolve(false);
                return;
            }
            let tagBuilder = new tagsBuilder_1.TagsBuilder();
            tagBuilder.generateTags(AbstractProvider.basePathForFilename(filename), false)
                .then((value) => {
                resolve(value === "");
                return;
            });
        });
    }
}
exports.AbstractProvider = AbstractProvider;
//# sourceMappingURL=abstractProvider.js.map