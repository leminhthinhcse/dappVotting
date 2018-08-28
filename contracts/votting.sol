pragma solidity ^0.4.0;

contract votting {
    
    struct scandidate{
        string name;
        uint id;
        uint vote;
        string image;
        string description;
    }
    uint public vcandidate_number;
    scandidate[] public vcandidate;
    uint[] public vcandidate_id;
    mapping (uint => string) public vcandidate_name;
    mapping (uint => uint) public vcandidate_vote;
    mapping (uint => string) public vcandidate_image;
    mapping (uint => string) public vcandidate_description;
    mapping (uint => uint) public vcandidate_index;
    
    struct svoter{
        string name;
        address adress;
        uint weight;
        address authorize;
        uint pick;
    }
    svoter[] public vvoter;
    address[] public vvoter_address;
    uint vvoter_number;
    mapping (address =>uint) public vvoter_index;
    mapping (address => string) public vvoter_name;
    mapping (address => uint) public vvoter_weight;
    mapping (address => address) public vvoter_authorize;
    mapping (address => uint) public vvoter_pick;
    
    bool public started;
    address public manager_address;
    uint public time;
    
    constructor(uint ttime) public {
        started = false;
        manager_address = msg.sender;
        time = ttime;
        vcandidate_number = 0;
        vvoter_number = 0;
    }
    
    modifier manager_modifier () {
        require(msg.sender == manager_address);
        _;
    }
    
    modifier voter_modifier () {
        require(vvoter_weight[msg.sender]>0);
        require(vvoter_pick[msg.sender]!=0);
        _;
    }
    
    modifier check_start() {
        require(!started);
        _;
    }
    
    modifier check_stop() {
        require(started);
        _;
    }
    
    
    function add_candidate(string tname, uint tid, string timage, string tdescription) public manager_modifier check_start {
        vcandidate.push(scandidate(tname, tid, 0, timage, tdescription));
        vcandidate_id.push(tid);
        vcandidate_name[tid]=tname;
        vcandidate_vote[tid]=0;
        vcandidate_image[tid]=timage;
        vcandidate_description[tid]=tdescription;
        vcandidate_index[tid] = vcandidate_number;
        vcandidate_number++;
    }
    
    function add_voter(string tname, address taddress) public manager_modifier check_start {
        vvoter.push(svoter(tname, taddress, 1,0x00,0));
        vvoter_address.push(taddress);
        vvoter_weight[taddress]=1;
        vvoter_authorize[taddress]=0x00;
        vvoter_name[taddress]=tname;
        vvoter_index[taddress]=vvoter_number;
        vvoter_pick[taddress] = 0;
        vvoter_number++;
    }
    
    function start_vote() public manager_modifier check_start {
        started = true;
    }
    
    function vote_done() public manager_modifier check_stop {
        started = false;
    }
    
    function vote(uint tid) public voter_modifier check_stop {
        
        uint index = vcandidate_index[tid];
        
        vcandidate_vote[tid] += vvoter_weight[msg.sender];
        vcandidate[index].vote += vvoter_weight[msg.sender];
        
        vvoter_pick[msg.sender] = tid;
        vvoter[vvoter_index[msg.sender]].pick = tid;
        
    }
    
    function voter_authorize(address taddress) public voter_modifier check_stop {
        
        if(vvoter_weight[taddress]>0 && vvoter_authorize[taddress] == 0x00){
            
            vvoter_weight[taddress] += vvoter_weight[msg.sender];
            vvoter[vvoter_index[taddress]].weight += vvoter_weight[msg.sender];
            
            vvoter_weight[msg.sender] = 0;
            vvoter[vvoter_index[msg.sender]].weight = 0;
            
            vvoter_authorize[msg.sender] = taddress;
            vvoter[vvoter_index[msg.sender]].authorize = taddress;
            
        }
        
    }
    
    
    
}
