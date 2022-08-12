import * as vscode from 'vscode';

import * as fs from 'fs';
import * as path from 'path';

interface InstructionData {
    instruction: string;
    documentation: string;
    key: string;
    description: string;
}

const conditioncodes = [
    'eq',
    'ne',
    'cs',
    'hs',
    'cc',
    'lo',
    'mi',
    'pl',
    'vs',
    'vc',
    'hi',
    'ls',
    'ge',
    'lt',
    'gt',
    'le',
    'al'
];

function fetchInstructionList(): InstructionData[] {
    let data = fs.readFileSync(path.resolve(__dirname, 'InstructionData.json'));
    return JSON.parse(data.toString());
}

const instructions = fetchInstructionList();

const instructionMap = new Map<string, InstructionData[]>();
instructions.forEach(inst => {
    let key = inst.key.toLowerCase();
    if (!instructionMap.has(key)) {
        instructionMap.set(key, []);
    }
    instructionMap.get(key)?.push(inst);
});

conditioncodes.forEach(cc => {
    // console.log(`b${cc}`);
    const bcond = instructionMap.get('b.cond');
    const bccond = instructionMap.get('bc.cond');
    if (bcond === undefined || bccond === undefined) {
        console.log('b or bc instruction not found')
        return;
    }
    instructionMap.set('b' + cc, bcond);
    instructionMap.set('bc' + cc, bccond);
});

const instructionCompletions = new vscode.CompletionList();

export function activate(context: vscode.ExtensionContext) {
    console.log('ARM64 extension activated');

    const helloWorldCommand = vscode.commands.registerCommand('arm64.helloWorld', () => {
        vscode.window.showInputBox({
            prompt: "What is your name?",
            title: "ARM64 HelloWorld"
        }).then((helloName) => {
            let message: string = '';
            if (helloName === undefined) {
                message = 'Hello from ARM64';
            } else {
                message = `${helloName}: Hello from ARM64`;
            }
            vscode.window.showInformationMessage(message);
        });
        vscode.window.showInformationMessage('Hello ARM64');
    });

    const androidRunCommmand = vscode.commands.registerCommand('arm64.androidrun', () => {
        const conf = vscode.workspace.getConfiguration('vscode-arm64');
        const adbpath = conf.adbpath;
        vscode.window.showInformationMessage(`Using adb: ${adbpath}`);

        vscode.window.showInputBox({
            prompt: "Executable name"
        }).then((name) => {
            if (name === undefined) {
                return;
            }
            let term = vscode.window.createTerminal("Android Run");
            term.show();
            term.sendText('dir');
        });
        // vscode.window.showQuickPick()
    });

    const clangCompileCommand = vscode.commands.registerCommand('arm64.clangcompile', () => {
        const conf = vscode.workspace.getConfiguration('vscode-arm64');
        const clangpath = conf.clangpath;
        const linkerpath = conf.linkerpath;
        vscode.window.showInformationMessage(`Using clang: ${clangpath}, linker: ${linkerpath}`);
    });

    context.subscriptions.push(helloWorldCommand);
    context.subscriptions.push(androidRunCommmand);
    context.subscriptions.push(clangCompileCommand);

    console.log(instructionMap.get('bne'));

    vscode.languages.registerHoverProvider('arm64', {
        provideHover(document, position, token) {
            // console.log(position.line);
            let line = document.lineAt(position.line);

            let regexp = new RegExp('\\s*(\\w+)');
            let match = line.text.match(regexp)
            if (match === null) {
                return;
            }
            let instruction = match[1].toLowerCase();

            let docdata = instructionMap.get(instruction);
            if (docdata === undefined) {
                return;
            }
            
            let result: vscode.MarkdownString[] = [];

            docdata.forEach(inst => {
                let markdownresult = new vscode.MarkdownString();
                markdownresult.appendMarkdown(`#### [${inst.instruction}](${inst.documentation})\n`);
                markdownresult.appendMarkdown(`${inst.description}`);
                result.push(markdownresult);
            });

            return {
                contents: result
            };
        }
    });

    /*
    vscode.languages.registerCompletionItemProvider('arm64', {
        provideCompletionItems(document, position, token, context) {
            console.log('triggered completion');
            let line = document.lineAt(position.line);

            let currentChar = line.text.charAt(position.character);
            let result = new vscode.CompletionList();
            for (let i = 0; i < 10; i++) {
                result.items.push(new vscode.CompletionItem(`Completion ${i}`));
            }
            
            return result;
        },

        resolveCompletionItem(item, token) {
            item.detail = item.label + ' detail'
            return item;
        }
    });
    */
}
