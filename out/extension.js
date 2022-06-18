"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
function activate(context) {
    console.log('ARM64 extension activated');
    const helloWorldCommand = vscode.commands.registerCommand('arm64.helloWorld', () => {
        vscode.window.showInformationMessage('Hello ARM64');
    });
    context.subscriptions.push(helloWorldCommand);
    vscode.languages.registerHoverProvider('arm64', {
        provideHover(document, position, token) {
            // console.log(position.line);
            return {
                contents: ['Line = ' + document.lineAt(position.line).text]
            };
        }
    });
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map