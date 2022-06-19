'use strict';

const fs = require('fs')

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

console.log(lines[0])
let matches = lines[0].match(regexp)
console.log(matches)

let instructions = [];
lines.forEach(line => {
    let match = line.match(regexp);
    instructions.push({
        documentation: 'https://developer.arm.com' + match[1],
        instruction: match[2],
        key: match[2].split(' ')[0].replace(',', ''),
        description: match[3]
    });
});

fs.writeFileSync('out/InstructionData.json', JSON.stringify(instructions, null, '    '));
