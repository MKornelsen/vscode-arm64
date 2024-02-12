import * as vscode from 'vscode';
import { InstructionData } from './instructions';

export function activateCompletions(instructionMap: Map<string, InstructionData[]>) {
    
    const buildLabelList = () => {
        
        const wfs = vscode.workspace.workspaceFolders;
        if (wfs == undefined || wfs.length < 1) {
            return;
        }
        // console.log(wfs[0]);
        
        const labelregex = new RegExp('\\s*(\\w+):');
        const labels: string[] = [];

        const pattern = new vscode.RelativePattern(wfs[0], '**/*.{s,S,asm}');
        vscode.workspace.findFiles(pattern).then((filepaths) => {
            filepaths.forEach((uri) => {
                vscode.workspace.openTextDocument(uri).then((doc) => {
                    // console.log(doc.fileName);
                    for (let i = 0; i < doc.lineCount; i++) {
                        const line = doc.lineAt(i).text;
                        const labelmatch = line.match(labelregex);
                        if (labelmatch !== null) {
                            console.log(labelmatch[1]);
                            labels.push(labelmatch[1]);
                        }
                    }
                });
            }); 
        });
        return labels;
    };

    const labels = buildLabelList();

    vscode.workspace.onDidChangeTextDocument((docChangeEvent) => {
        console.log(docChangeEvent.document.fileName);
    });

    vscode.languages.registerCompletionItemProvider('arm64', {
        provideCompletionItems: function (document, position, token, context) {
            console.log('Completion invoked');
            // console.log(`completion at: ${document.fileName}, position: ${position}`);
            
            const doctext = document.getText();
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
