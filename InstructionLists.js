'use strict';

const fs = require('fs');
const https = require('https');

const websiteUrl = 'https://developer.arm.com';
const apiUrl = 'https://documentation-service.arm.com';

const baseInstructionsUrl = 'https://documentation-service.arm.com/documentation/ddi0602/2024-09/Base-Instructions?lang=en&baseUrl=/documentation';
const simdInstructionsUrl = 'https://documentation-service.arm.com/documentation/ddi0602/2024-09/SIMD-FP-Instructions?lang=en&baseUrl=/documentation';
const sveInstructionsUrl = 'https://documentation-service.arm.com/documentation/ddi0602/2024-09/SVE-Instructions?lang=en&baseUrl=/documentation';

async function loadInstructionList(url) {

    const listPromise = new Promise((resolve, reject) => {
        https.get(url, res => {
            console.log(res.statusCode);
            console.log(res.headers);
            
            let data = Buffer.alloc(0);
            res.on('data', chunk => {
                console.log('new chunk');
                console.log(chunk);
                data = Buffer.concat([data, chunk]);
            });
    
            res.on('end', () => {
                console.log('complete data');
                console.log(data);
    
                const jsonData = JSON.parse(data.toString());
                //    console.log(jsonData);
    
                const decoded = Buffer.from(jsonData.content, 'base64').toString('utf8');
                //    console.log(decoded);
                resolve(decoded);
            });

            res.on('error', (err) => {
                reject(err);
            });
        });
    });

    const htmllist = await listPromise;

    console.log('awaited result:');
    console.log(htmllist);

    const lines = htmllist.split('\n').filter(line => {
        return line.includes('class="document-topic"');
    });

    console.log(lines);

    const regexp = new RegExp('.*<a href="(\\S*)".*>(.*)</a>: (.*).</span>.*');

    const instructions = [];

    lines.forEach(line => {
        const match = line.match(regexp);
        console.log(match);

        const inst = match[2]
            .replaceAll('&amp;', '&')
            .replaceAll('&lt;', '<')
            .replaceAll('&gt;', '>');
    
        instructions.push({
            documentation: websiteUrl + match[1],
            instruction: inst,
            key: inst.split(' ')[0].replace(',', ''),
            description: match[3]
                .replaceAll('&amp;', '&')
                .replaceAll('&lt;', '<')
                .replaceAll('&gt;', '>')
        });
    });

    return instructions;
}

async function loadDetails(instruction) {

    const url = instruction.documentation.replace(websiteUrl, apiUrl);

    const detailsPromise = new Promise((resolve, reject) => {
        https.get(url, res => {

            let data = Buffer.alloc(0);
            res.on('data', chunk => {
                data = Buffer.concat([data, chunk]);
            });

            res.on('end', () => {
                const jsonData = JSON.parse(data.toString());
                resolve({
                    instruction: instruction.instruction,
                    encdetail: jsonData.content
                });
            });

            res.on('error', err => {
                reject(err);
            });
        });
    });

    return await detailsPromise;
}

async function loadAllInstructions(withDetails) {
    const base = await loadInstructionList(baseInstructionsUrl);
    const simdfp = await loadInstructionList(simdInstructionsUrl);
    const sve = await loadInstructionList(sveInstructionsUrl);
    sve.forEach((sveinst) => {
        sveinst.sve = true;
    });

    const fullList = base.concat(simdfp, sve);

    fs.writeFileSync('InstructionList.json', JSON.stringify(fullList, undefined, ' '));

    if (withDetails === true) {
        const detailsList = [];

        for (let i = 0; i < fullList.length; i += 10) {
            const segment = fullList.slice(i, i + 10);
            console.log('loading details:', segment.map((inst) => inst.instruction).join(' '));
            const promises = segment.map((inst) => loadDetails(inst));
            detailsList.push(...await Promise.all(promises));
        }

        fs.writeFileSync('InstructionListDetail.json', JSON.stringify(detailsList, undefined, ' '));
    }
}

const argFull = process.argv.find((arg) => arg === '--full') !== undefined;

loadAllInstructions(argFull).then(() => {
    console.log('done');
});
