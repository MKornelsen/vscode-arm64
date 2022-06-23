import * as vscode from 'vscode';

import * as fs from 'fs';
import * as path from 'path';

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
    instructionMap.get(key).push(inst);
});

conditioncodes.forEach(cc => {
    // console.log(`b${cc}`);
    instructionMap.set('b' + cc, instructionMap.get('b.cond'));
    instructionMap.set('bc' + cc, instructionMap.get('bc.cond'));
});

const instructionCompletions = new vscode.CompletionList();

export function activate(context: vscode.ExtensionContext) {
    console.log('ARM64 extension activated');

    const helloWorldCommand = vscode.commands.registerCommand('arm64.helloWorld', () => {
        vscode.window.showInformationMessage('Hello ARM64');
    });

    context.subscriptions.push(helloWorldCommand);

    console.log(instructionMap.get('bne'));

    vscode.languages.registerHoverProvider('arm64', {
        provideHover(document, position, token) {
            // console.log(position.line);
            let line = document.lineAt(position.line);

            let regexp = new RegExp('\\s*(\\w+)')
            let instruction = line.text.match(regexp)[1].toLowerCase()
            
            let docdata = instructionMap.get(instruction);

            let result = [];
            
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
}

interface InstructionData {
    instruction: string;
    documentation: string;
    key: string;
    description: string;
}
