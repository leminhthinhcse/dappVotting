import React, { Component } from 'react';
import './App.css';
import web3 from './web3';
import votting from './votting';
import ipfs from './ipfs';

const utf8 = require('utf8');

class App extends Component {
  state = {
    ipfsHash: null,
    buffer : '',
    x: '',
    numberCandidate:''
  }

  constructor(props) {
    super(props);
    this.getvalue();
  }

  checkChangeAccounts = async (account)=> {
    console.log('Check change account!');
    let tem = await web3.eth.getAccounts();
    console.log(`Check: ${tem} === ${account} | ${tem.toString() === account.toString()}`);
    while (account.toString() === tem.toString()) {
      tem = await web3.eth.getAccounts();
      if(account.toString() != tem.toString()) setTimeout("location.reload(true)",1);
      console.log('Check change account!');
    }
  }

  getvalue = async () => {
    //get Numbers of Candidate
    const accounts = await web3.eth.getAccounts();
    let role = "guest";

    this.checkChangeAccounts(accounts);

    await votting.methods.vcandidate_number().call().then( data => {
      this.setState({numberCandidate: data});
      console.log(`Number of Candidate: ` + data);
    });

    //get Information of Candidate
    this.setState({infoCandidate:[]});
    
    await votting.methods.vcandidate(0).call().then( data => {
      this.setState({winCandidate: data});
    });

    for(let i=0;i< this.state.numberCandidate;i++){
      await votting.methods.vcandidate(i).call().then( data => {
        this.state.infoCandidate.push(data);
        document.querySelector('.infoCandidate').insertAdjacentHTML("beforeend",this.showCandidate(data.name,data.id,data.vote,data.image));
        this.state.winCandidate = (this.state.winCandidate.vote < data.vote ? data : this.state.winCandidate);
      });  
    }

    console.log(`Winer: ${this.state.winCandidate.name}`);

    const btnVote = document.getElementsByClassName("vote");
    console.log(btnVote);
    Array.prototype.forEach.call(btnVote, x => {
      x.onclick = () => this.vote(x.value);
    })
    console.log(this.state.infoCandidate);

    await votting.methods.vvoter_number().call().then( data => {
      this.setState({numberVoter: data});
      console.log(`Number of Voter: ` + data);
    })

    this.setState({infoVoter:[]});
    for (let i=0;i<this.state.numberVoter;i++){
      await votting.methods.vvoter(i).call().then(data => {
        this.state.infoVoter.push(data)
        if (accounts.toString() === data.adress) role = "voter";
      });
    }
    console.log(this.state.infoVoter);

    await votting.methods.started().call().then(data => this.setState({started: data}));
    console.log(`Started? ` + this.state.started)

    await votting.methods.manager_address().call().then(data => {
      this.setState({managerAddress: data});
      if (accounts.toString() === data) role = "admin";
    });
    console.log(`Manager address: ${this.state.managerAddress}`);

    this.showWithRole(role);

  }

  showWithRole = (x = '') => {
    const classAdmin = document.getElementById("admin");
    const classVoter = document.getElementById("voter");
    switch (x) {
      case "admin":
        classAdmin.style.display = "block";
        classVoter.style.display = "none";
        break;
      case "voter":
        classAdmin.style.display = "none";
        classVoter.style.display = "block";
        break;
      default:
        classAdmin.style.display = "none";
        classVoter.style.display = "none";
        break;
    }
  }

  vote = (id) => {
    alert(`Ban vote cho ${id}`);
  }


  showCandidate(name,id,vote,picture) {
    return `
    <div>Name: ${name}, ID: ${id}, Vote: ${vote}, picture: <img src="https://gateway.ipfs.io/ipfs/${picture}"/> <button class="vote" type="button" value = "${id}" >Vote!</button> </div>
    `;
  }

  String2Hex = (tmp) => {
    var str = '';
    for(var i = 0; i < tmp.length; i++) {
        str += tmp[i].charCodeAt(0).toString(16);
    }
    return "0x"+str;
  };

  Hex2String = (tmp) => {
    var str = '';
    for(var i = 2; i < tmp.length; i=i+2) {
      str += "\\x";  
      str += tmp[i];
      str += tmp[i+1];
    }
    return str;
  };

  captureFile =(event) => {
    event.stopPropagation()
    event.preventDefault()
    const file = event.target.files[0]
    let reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => this.convertToBuffer(reader)    
  };

  convertToBuffer = async(reader) => {
    //file is converted to a buffer for upload to IPFS
      const buffer = await Buffer.from(reader.result);
    //set this buffer -using es6 syntax
      this.setState({buffer});
  };

  addCandidate = async (event) => {
    event.preventDefault();
    const accounts = await web3.eth.getAccounts();
    console.log('Sending from Metamask account: ' + accounts[0]);

    console.log({message: 'Đang cập nhật ứng viên ...'});
    var name = document.getElementsByName("addCandidateName")[0].value;
    var ms = document.getElementsByName("addCandidateID")[0].value;
    await ipfs.add(this.state.buffer, (err, ipfsHash) => {
      this.setState({ ipfsHash:ipfsHash[0].hash });

      votting.methods.add_candidate(name, ms, this.state.ipfsHash, "").send({
        from: accounts[0] 
      }, (error, transactionHash) => {
        console.log(transactionHash);
        console.log("Cập nhật ứng viên thành công!");
        setTimeout("location.reload(true)",60000);
      }); //storeIPFS
      
    }) //await ipfs.add 
  };

  addVoter = async (event) => {
    event.preventDefault();
    const accounts = await web3.eth.getAccounts();
    console.log('Sending from Metamask account: ' + accounts[0]);

    console.log("Uploading voter");

    var name = document.getElementsByName("addVoterName")[0].value;
    var address = document.getElementsByName("addVoterAddress")[0].value;

    await votting.methods.add_voter(name,address).send({
      from: accounts[0]
    }, (error, transactionHash)=> {
      console.log(transactionHash);
      console.log("Uploaded voter!");
      setTimeout("location.reload(true)",1);
    })
  };

  voterAuthorize = async (event) => {
    event.preventDefault();
    const accounts = await web3.eth.getAccounts();
    console.log("Voter Authorize");
    console.log('Sending from Metamask account: ' + accounts[0]);
  
    var address = document.getElementsByName("voter_authorize")[0].value;

    await votting.methods.voter_authorize(address).send({
      from: accounts[0]
    });

  };

  render() {
    //web3.eth.getAccounts().then(console.log);
    return (
      <div className="App">
        <div id="admin" >
        <form onSubmit = {this.addCandidate}>
          <h3>Add Candidate</h3>
          <label>
            Name:
            <input type="text" name="addCandidateName" required/>
          </label> <br/>
          <label>
            ID:
            <input type="text" name="addCandidateID" required/>
          </label> <br/>
          <label>
            Image:
            <input type = "file" name="addCandidateImage" onChange = {this.captureFile} required/>
          </label> <br/>
          <input type="submit" value="Add"/>
        </form>

        <form onSubmit = {this.addVoter}>
          <h3>Add Voter</h3>
          <label>
            Name:
            <input type="text" name="addVoterName" required/>
          </label> <br/>
          <label>
            Address:
            <input type="text" name="addVoterAddress" required/>
          </label> <br/>
          <input type="submit" value="Add"/>
        </form>
        </div>

        <div id="voter">
        <form onSubmit = {this.voterAuthorize}>
          <h3>Vote Authorize</h3>
          <label>
            Address:
            <input type="text" name="voter_authorize" required/>
          </label> <br/>
          <input type="submit" value="Authorize"/>
        </form>
        </div>
        
        <h3>List of Candidate {this.state.numberCandidate}</h3>
        <div class="infoCandidate"></div>
      </div>
    );
  }
}

export default App;
