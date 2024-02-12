import * as vscode from 'vscode';

import { InstructionData } from './instructions';

export function activateHover(instructionMap: Map<string, InstructionData[]>) {
    vscode.languages.registerHoverProvider('arm64', {
        provideHover(document, position, token) {
            // console.log(position.line);
            const line = document.lineAt(position.line);
        
            const regexp = new RegExp('\\s*(\\w+)');
            const match = line.text.match(regexp);
            if (match === null) {
                return;
            }
            const instruction = match[1].toLowerCase();
        
            const docdata = instructionMap.get(instruction);
            if (docdata === undefined) {
                return;
            }
            
            const result: vscode.MarkdownString[] = [];
        
            docdata.forEach(inst => {
                const markdownresult = new vscode.MarkdownString();
                markdownresult.appendMarkdown(`#### [${inst.instruction}](${inst.documentation})\n`);
                markdownresult.appendMarkdown(`${inst.description}`);
                result.push(markdownresult);
            });
        
            return {
                contents: result
            };
        }
    });
}
