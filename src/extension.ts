import * as vscode from 'vscode'

import * as http2 from 'http2';

export function activate(context: vscode.ExtensionContext) {
    console.log('ARM64 extension activated');

    const helloWorldCommand = vscode.commands.registerCommand('arm64.helloWorld', () => {
        vscode.window.showInformationMessage('Hello ARM64');
    });

    context.subscriptions.push(helloWorldCommand);

    const instructions = fetchInstructionList();

    vscode.languages.registerHoverProvider('arm64', {
        provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken) {
            // console.log(position.line);
            return {
                contents: ['Line = ' + document.lineAt(position.line).text]
            };
        }
    });
}

function fetchInstructionList() {
    const client = http2.connect('https://documentation-service.arm.com');

    client.on('error', (err) => console.error(err));
    const req = client.request({
        ':path': '/documentation/ddi0602/2022-03/Base-Instructions'
    });

    req.on('response', (headers, flags) => {
        for (const name in headers) {
            console.log(`${name}: ${headers[name]}`);
        }
    });
    
    req.setEncoding('utf8');
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
        client.close();
        
        console.log(`\n${data}`);

        let parsed = JSON.parse(data).content;
        console.log(parsed);
        let buff = Buffer.from(parsed, 'base64');
        let text = buff.toString('ascii');
        console.log(text);
    });
    req.end();

}
