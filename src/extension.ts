import * as vscode from 'vscode';

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

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

const instructionMap = new Map<string, InstructionData[]>();

function fetchInstructionList(filepath: string) {
    let data = fs.readFileSync(filepath);
    const instructions: InstructionData[] = JSON.parse(data.toString());

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
}

const mkexec = (cmd: string, cwd: string) => {
    return new Promise<string[]>((resolve) => {
        exec(cmd, {
            cwd: cwd
        }, (error, stdout, stderr) => {
            resolve([stdout, stderr]);
        });
    });
}

async function execsequence(cmds: string[], cwd: string, outputstream: vscode.OutputChannel) {
    outputstream.show();
    for (const cmd of cmds) {
        outputstream.appendLine('$ ' + cmd);
        const [stdout, stderr] = await mkexec(cmd, cwd);
        if (stdout != '') {
            outputstream.appendLine(stdout);
        }
        if (stderr != '') {
            outputstream.appendLine(stderr);
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('ARM64 extension activated');
    console.log(context.asAbsolutePath('InstructionData.json'));
    fetchInstructionList(context.asAbsolutePath('InstructionData.json'));

    let outputstream = vscode.window.createOutputChannel('vscode-arm64', 'ARM64');

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
        if (adbpath == '') {
            vscode.window.showWarningMessage('You should probably set the adb executable in preferences');
        }
    
        vscode.window.showInputBox({
            prompt: "Executable name (leave blank for a.out)"
        }).then((name) => {
            if (name === undefined || name === '') {
                name = 'a.out';
            }
    
            const wfs = vscode.workspace.workspaceFolders;
            if (wfs == undefined || wfs.length < 1) {
                vscode.window.showErrorMessage('You need to have a workspace open');
                return;
            }
            const cwd = wfs[0].uri.fsPath;
            console.log(cwd);
    
            const pushcmd = `${adbpath} push ${name} /data/local/tmp`;
            const chmodcmd = `${adbpath} shell chmod +x /data/local/tmp/${name}`;
            const runcmd = `${adbpath} shell /data/local/tmp/${name}`;
    
            execsequence([pushcmd, chmodcmd, runcmd], cwd, outputstream);
        });
    });
    
    const clangCompileCommand = vscode.commands.registerCommand('arm64.clangcompile', () => {
        const conf = vscode.workspace.getConfiguration('vscode-arm64');
        const clangpath = conf.clangpath;
        const linkerpath = conf.linkerpath;
        vscode.window.showInformationMessage(`Using clang: ${clangpath}, linker: ${linkerpath}`);
        if (clangpath == '' || linkerpath == '') {
            vscode.window.showWarningMessage(`Make sure your clangpath and linkerpath are set`);
        }
        
        const wfs = vscode.workspace.workspaceFolders;
        if (wfs == undefined || wfs.length < 1) {
            vscode.window.showErrorMessage('You need to have a workspace open');
            return;
        }
        // console.log(wfs[0]);
        const cwd = wfs[0].uri.fsPath;
        
        const pattern = new vscode.RelativePattern(wfs[0], '**/*.{s,S,asm}');
        vscode.workspace.findFiles(pattern).then((filepaths) => {
            console.log(filepaths);
            const filelist = filepaths.map((uri) => {
                return path.relative(wfs[0].uri.toString(), uri.toString());
            });
            vscode.window.showQuickPick(filelist, {
                canPickMany: true,
                title: 'Files to assemble'
            }).then((files) => {
                console.log(files);
                if (files === undefined || files.length < 1) {
                    vscode.window.showErrorMessage('Select at least one file to assemble');
                    return;
                }
    
                const cmdseq = [];
    
                files.forEach((fn) => {
                    const command = `${clangpath} -x assembler -target aarch64-linux-android -c ${fn} -o ${fn}.o`;
                    cmdseq.push(command);
                });
    
                let linkercmd = `${linkerpath}`;
                files.forEach((fn) => {
                    linkercmd = `${linkercmd} ${fn}.o`;
                });
                linkercmd = `${linkercmd} -o a.out`
                cmdseq.push(linkercmd);
    
                execsequence(cmdseq, cwd, outputstream);
            });
        });
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

    const buildLabelList = () => {
        
        const wfs = vscode.workspace.workspaceFolders;
        if (wfs == undefined || wfs.length < 1) {
            return;
        }
        // console.log(wfs[0]);
        
        const labelregex = new RegExp('\\s*(\\w+):');
        const labels: string[] = []

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
    }

    const labels = buildLabelList();

    vscode.workspace.onDidChangeTextDocument((docChangeEvent) => {
        console.log(docChangeEvent.document.fileName);
    })

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

export function deactivate() {}
