const path = require('path');
const fs = require('fs');
const solc = require('solc');

const showpath = path.resolve(__dirname,'contracts','votting.sol');
const source = fs.readFileSync(showpath, 'utf8');

module.exports = solc.compile(source, 1).contracts[':votting'];