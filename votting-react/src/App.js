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

  getvalue = async () => {
    //get Numbers of Candidate
    await votting.methods.vcandidate_number().call().then( data => {
      this.setState({numberCandidate: data});
      console.log(`Number of Candidate: ` + data);
    });

    //get Information of Candidate
    this.setState({infoCandidate:[]});
    for(let i=0;i< this.state.numberCandidate;i++){
      await votting.methods.vcandidate(i).call().then( data => {this.state.infoCandidate.push(data);
      document.querySelector('.infoCandidate').insertAdjacentHTML("beforeend",this.showCandidate(data.name,data.id,data.vote,data.image));
      });  
    }
    console.log(this.state.infoCandidate);

    await votting.methods.vvoter_number().call().then( data => {
      this.setState({numberVoter: data});
      console.log(`Number of Voter: ` + data);
    })

    this.setState({infoVoter:[]});
    for (let i=0;i<this.state.numberVoter;i++){
      await votting.methods.vvoter(i).call().then(data => this.state.infoVoter.push(data));
    }
    console.log(this.state.infoVoter);

  }

  showCandidate(name,id,vote,picture) {
    return `
    <div>Name: ${name}, ID: ${id}, Vote: ${vote}, picture: <img src="https://gateway.ipfs.io/ipfs/${picture}" /></div>
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

  render() {
    //web3.eth.getAccounts().then(console.log);
    return (
      <div className="App">
        
        <form onSubmit = {this.addCandidate}>
          <h3>Add Candidate</h3>
          <label>
            Name:
            <input type="text" name="addCandidateName"/>
          </label> <br/>
          <label>
            ID:
            <input type="text" name="addCandidateID" />
          </label> <br/>
          <label>
            Image:
            <input type = "file" name="addCandidateImage" onChange = {this.captureFile}/>
          </label> <br/>
          <input type="submit" value="Add"/>
        </form>

        <form onSubmit = {this.addVoter}>
          <h3>Add Voter</h3>
          <label>
            Name:
            <input type="text" name="addVoterName"/>
          </label> <br/>
          <label>
            Address:
            <input type="text" name="addVoterAddress" />
          </label> <br/>
          <input type="submit" value="Add"/>
        </form>

        <h3>List of Candidate {this.state.numberCandidate}</h3>
        <div class="infoCandidate"></div>
      </div>
    );
  }
}

export default App;
