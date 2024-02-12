import * as vscode from 'vscode';

import * as fs from 'fs';

import { InstructionData, InstructionDetail } from './instructions';
import { activateHover } from './hover';
import { activateCommands } from './commands';
import { activateCompletions } from './completion';

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
    const data = fs.readFileSync(filepath);
    const instructions: InstructionData[] = JSON.parse(data.toString());

    instructions.forEach(inst => {
        const key = inst.key.toLowerCase();
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
            console.log('b or bc instruction not found');
            return;
        }
        instructionMap.set('b' + cc, bcond);
        instructionMap.set('bc' + cc, bccond);
    });
}

export function activate(context: vscode.ExtensionContext) {
    console.log('ARM64 extension activated');
    const listPath = context.asAbsolutePath('InstructionList.json');
    console.log(listPath);
    fetchInstructionList(listPath);
    console.log(instructionMap.get('bne'));

    activateCommands(context);

    activateHover(instructionMap);

    activateCompletions(instructionMap);
}

export function deactivate() {}
