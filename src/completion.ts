import * as vscode from 'vscode';
import { InstructionData } from './instructions';

export function activateCompletions(instructionMap: Map<string, InstructionData[]>) {

    vscode.workspace.onDidChangeTextDocument((docChangeEvent) => {
        console.log(docChangeEvent.document.fileName);
    });

    vscode.languages.registerCompletionItemProvider('arm64', {
        provideCompletionItems: function (document, position, token, context) {
            console.log('Completion invoked');
            // console.log(`completion at: ${document.fileName}, position: ${position}`);
            // console.log(doctext);
            return null;
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
