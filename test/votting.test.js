const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const provider = ganache.provider();
const web3 = new Web3(provider);
const { interface, bytecode } = require('../compile');

let account;
let cname;

beforeEach( async () => {
   //Lay danh sach tat ca tai khoan
   account = await web3.eth.getAccounts();
   //console.log(account);
  
   // use one of those account to deploy
   //the contract
   cname = await new web3.eth.Contract(JSON.parse(interface))
   .deploy({
       data: bytecode,
       arguments: []
   })
   .send({
       from: account[0],
       gas: '1000000'
   });
   cname.setProvider(provider);

});

describe('votting', () =>{
   it('Lay danh sach tai khoan', () => {
       assert.ok(cname.options.address);
   });

});
