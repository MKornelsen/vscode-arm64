'use strict';

const fs = require('fs')
const https = require('https');

let basedata = fs.readFileSync('BaseInstructions.b64', 'utf8');
let simddata = fs.readFileSync('SimdInstructions.b64', 'utf8');
let svedata = fs.readFileSync('SVEInstructions.b64', 'utf8');

let baseDecoded = Buffer.from(basedata, 'base64').toString('ascii');
let simdDecoded = Buffer.from(simddata, 'base64').toString('ascii');
let sveDecoded = Buffer.from(svedata, 'base64').toString('ascii');
// console.log(decodedData)

let lines = [];
lines = lines.concat(baseDecoded.split('\n'));
lines = lines.concat(simdDecoded.split('\n'));
lines = lines.concat(sveDecoded.split('\n'));
lines = lines.filter(line => {
    return line.includes('class=\"document-topic\"');
});
// console.log(lines)

const regexp = new RegExp('.*<a href=\"(\\S*)\".*>(.*)</a>: (.*).</span>.*');

// console.log(lines[100]);
let matches = lines[2].match(regexp);
console.log(matches);
console.log(matches[1]);

const testPromise = new Promise(resolve => {
    let req = https.get('https://documentation-service.arm.com' + matches[1], res => {
        console.log(res.statusCode);
        console.log(res.headers);

        let fulldata = '';
        res.on('data', data => {
            // console.log(data.toString());
            fulldata = fulldata + data.toString();
        });

        res.on('end', () => {
            let parsed = JSON.parse(fulldata);
            let decoded = Buffer.from(parsed.content, 'base64').toString('ascii');
            fs.writeFileSync('exampledetail.html', decoded);
            resolve();
        });
    });
});

testPromise.then(() => {
    console.log('testPromise resolved');
});

let instructions = [];

const promises = [];

const idstatus = new Map();

const loadDetail = (line) => new Promise((resolve, reject) => {
    const match = line.match(regexp);
    https.get('https://documentation-service.arm.com' + match[1], res => {
        console.log(match[2] + ': ' + res.statusCode);
        idstatus.set(match[2], 'open');
        if (res.statusCode != 200) {
            reject('uh oh bad exit code');
        }
        // console.log(res.headers);

        let fulldata = '';
        res.on('data', data => {
            // console.log(data.toString());
            fulldata = fulldata + data.toString();
        });

        res.on('end', () => {
            let parsed = JSON.parse(fulldata);
            let decoded = Buffer.from(parsed.content, 'base64').toString('ascii');
            // console.log(decoded);
            const result = {
                instruction: match[2],
                encdetail: parsed.content
            };
            // console.log(match[2] + ' done');
            idstatus.set(match[2], 'done');
            resolve(result);
        });
    }).on('error', () => {
        console.log(match[2] + ' had an error');
    });
});

lines.forEach(line => {
    let match = line.match(regexp);

    let inst = match[2].replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>');
    instructions.push({
        documentation: 'https://developer.arm.com' + match[1],
        instruction: inst,
        key: inst.split(' ')[0].replace(',', ''),
        description: match[3].replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>')
    });
});

fs.writeFileSync('InstructionData.json', JSON.stringify(instructions, null, '    '));

async function loadAllDetails() {
    const instructiondetail = [];
    for (const line of lines) {
        const idetail = await loadDetail(line);
        instructiondetail.push(idetail);
    }
    fs.writeFileSync('InstructionDetail.json', JSON.stringify(instructiondetail, null, '    ')); 
}
loadAllDetails();

setTimeout(() => {
    // console.log('doing idstatus check');
    // console.log(idstatus);
    console.log(idstatus.size);
    let donecount = 0;
    let othercount = 0;
    idstatus.forEach((value, key) => {
        if (value != 'done') {
            console.log(`${key}: ${idstatus.get(key)}`);
            donecount++;
        } else {
            othercount++;
        }
    });
    console.log(`done: ${donecount}\nother: ${othercount}`);
    console.log(lines.length);
}, 30000)
