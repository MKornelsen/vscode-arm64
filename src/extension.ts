import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
    console.log('ARM64 extension activated');

    const helloWorldCommand = vscode.commands.registerCommand('arm64.helloWorld', () => {
        vscode.window.showInformationMessage('Hello ARM64');
    });

    context.subscriptions.push(helloWorldCommand);

    vscode.languages.registerHoverProvider('arm64', {
        provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
            // console.log(position.line);
            return {
                contents: ['Line = ' + document.lineAt(position.line).text]
            };
        }
    });
}


