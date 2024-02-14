import * as vscode from 'vscode';

import * as path from 'path';
import { exec } from 'child_process';

async function execsequence(cmds: string[], cwd: string, outputstream: vscode.OutputChannel) {
    outputstream.show();
    for (const cmd of cmds) {
        outputstream.appendLine('$ ' + cmd);

        const cmdpromise = new Promise<string[]>(resolve => {
            exec(cmd, {
                cwd: cwd
            }, (error, stdout, stderr) => {
                resolve([stdout, stderr]);
            });
        });

        const [stdout, stderr] = await cmdpromise;
        if (stdout != '') {
            outputstream.appendLine(stdout);
        }
        if (stderr != '') {
            outputstream.appendLine(stderr);
        }
    }
}

export function activateCommands(context: vscode.ExtensionContext) {
    const outputstream = vscode.window.createOutputChannel('vscode-arm64', 'ARM64');

    const helloWorldCommand = vscode.commands.registerCommand('arm64.helloWorld', () => {
        vscode.window.showInputBox({
            prompt: 'What is your name?',
            title: 'ARM64 HelloWorld'
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

    const androidRunCommmand = vscode.commands.registerCommand('arm64.androidrun', (outputstream) => {
        const conf = vscode.workspace.getConfiguration('vscode-arm64');
        const adbpath = conf.adbpath;
        vscode.window.showInformationMessage(`Using adb: ${adbpath}`);
        if (adbpath == '') {
            vscode.window.showWarningMessage('You should probably set the adb executable in preferences');
        }
    
        vscode.window.showInputBox({
            prompt: 'Executable name (leave blank for a.out)'
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
            vscode.window.showWarningMessage('Make sure your clangpath and linkerpath are set');
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
                    const command = `${clangpath} -x assembler -c ${fn} -o ${fn}.o`;
                    cmdseq.push(command);
                });
    
                let linkercmd = `${linkerpath}`;
                files.forEach((fn) => {
                    linkercmd = `${linkercmd} ${fn}.o`;
                });
                linkercmd = `${linkercmd} -o a.out`;
                cmdseq.push(linkercmd);
    
                execsequence(cmdseq, cwd, outputstream);
            });
        });
    });

    context.subscriptions.push(helloWorldCommand);
    context.subscriptions.push(androidRunCommmand);
    context.subscriptions.push(clangCompileCommand);
}
