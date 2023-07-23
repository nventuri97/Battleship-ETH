const { errors } = require("web3");

//Welcome page object
const welcomePage=document.querySelector('#welcome-page');
const homeBtn=document.querySelector('#back-home-btn');
const setUpNewGameDiv=document.querySelector('#set-up-new-game');
const sendGameConditionBtn=document.querySelector('#send-game-condition-btn');
const setUpJoinGameDiv=document.querySelector('#set-up-join-game');
const createNewGameBtn=document.querySelector('#create-new-game-btn');
const joinGameBtn=document.querySelector('#join-game-btn');
const sendGameIdBtn=document.querySelector('#send-game-id-btn');
const acceptGameConditionDiv=document.querySelector('#accept-game-condition');
const acceptGameConditionBtn=document.querySelector('#accept-game-condition-btn');
const quitGameConditionBtn=document.querySelector('#quit-game-condition-btn');

//Game page object
const gamePage=document.querySelector('#game-page');
const user_grid=document.getElementById('user-grid');
const opponent_grid=document.getElementById('opponent-grid');
const rotate_btn=document.querySelector('#rotate');
const grid_display=document.querySelector('.grid-display');
const ships=document.querySelectorAll('.ship');
const destroyer = document.querySelector('.destroyer-container');
const submarine = document.querySelector('.submarine-container');
const cruiser = document.querySelector('.cruiser-container');
const battleship = document.querySelector('.battleship-container');
const carrier = document.querySelector('.carrier-container');
const quitBtn=document.querySelector('#quit-game-btn');
const startGameBtn=document.querySelector('#start');
const playerTurn=document.querySelector('#whose-go');
const playerInfo=document.querySelector('#info');
const userInfo=document.querySelector(`.p1`);
const opponentInfo=document.querySelector(`.p2`);

var gameId = null;
var grandPrize = null;
var boardSize = null;
var destroyerCount=0;
var submarineCount=0;
var cruiserCount=0;
var battleshipCount=0;
var carrierCount=0;
const userSquares=[];
const opponentSquares=[];
let draggedShip;
let draggedShipLength;
let selectedShipNameWithIndex;
let isHorizontal = true;
let allShipsPlaced=false;
let userTurn=false;
let shotFire=-1;
let sunk="";
const userBoardMatrix=[];
//Ships
const shipArray = [];

App = {
  web3Provider: null,
  contracts: {},

  init: async function () {

    // return await App.bindEvents();
    return await App.initWeb3();
  },

  initWeb3: async function () {
    /*
     * Replace me...
     */

    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        await window.ethereum.enable();		// Request account access
      } catch (error) {
        console.error("User denied account access");	// User was denied account access
      }
    }
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    else {
      App.web3Provider = new Web3.provider.HttpProvider("http://localhost:7545");
    }
    web3 = new Web3(App.web3Provider);
    web3.eth.defaultAccount = web3.eth.accounts[0];
    return App.initContract();
  },

  initContract: function () {
    /*
     * Replace me...
     */
    $.getJSON("Battleship.json", function (data) {
      var BattleshipArtifact = data;
      // Get the contract artifact and initialize it
      App.contracts.Battleship = TruffleContract(BattleshipArtifact);

      // Set the web3.js provider for our contract to the provider defined in the previous function
      App.contracts.Battleship.setProvider(App.web3Provider);
    });

    return App.bindEvents();
  },

  bindEvents: async function () {
    homeBtn.addEventListener('click', App.backHome);
    createNewGameBtn.addEventListener('click', App.createNewGame);
    joinGameBtn.addEventListener('click', App.joinGame);
    sendGameConditionBtn.addEventListener('click', App.setGameCondition);
    sendGameIdBtn.addEventListener('click', App.findGame);
    acceptGameConditionBtn.addEventListener('click', App.acceptGameCondition);
    quitGameConditionBtn.addEventListener('click', App.backHome);
    quitBtn.addEventListener('click', App.quitGame);
    rotate_btn.addEventListener('click', App.rotate);
    startGameBtn.addEventListener('click', App.startGame);

    ships.forEach(ship => {
      ship.addEventListener('dragstart', App.dragStart)
      ship.addEventListener('mousedown', (e) => {
        selectedShipNameWithIndex = e.target.id;
      })
    });

    $(document).on('input', "#boardSize", (event) => boardSize = event.target.value);
    $(document).on('input', "#grandPrize", (event) => grandPrize = event.target.value);

    $(document).on('input', '#gameId', (event) => gameId = event.target.value);
  },

  backHome: function() {
    gamePage.style.display='none';
    welcomePage.style.display='block';
    setUpNewGameDiv.style.display='none';
    setUpJoinGameDiv.style.display='none';
    createNewGameBtn.style.display='block';
    joinGameBtn.style.display='block';
    acceptGameConditionDiv.style.display='none';
  },

  createNewGame: function() {
    console.log("Creating new game...")
    joinGameBtn.style.display='none';
    createNewGameBtn.style.display='none';
    setUpNewGameDiv.style.display='block';
  },

  joinGame: function() {
    console.log("Joining an existing game...")
    createNewGameBtn.style.display='none';
    joinGameBtn.style.display='none';
    setUpJoinGameDiv.style.display='block';
  },

  setGameCondition: function(){
    // Check to validate the correctness of the parameters from the creation of new game view
    if(!boardSize || !grandPrize)
      return alert("An input parameters is empty, check board size or grand size!");
    else if(boardSize < 5 || boardSize>12)
      return alert("The board size has to be grather or equals to 5 and equals or minor to 12, change it!");
    else if(grandPrize<=0)
      return alert("The grand prize has to be grather than 0, change it!");

    boardSize=parseInt(boardSize)
    shipArray.push({
      name: 'destroyer',
      directions: [
        [0, 1],
        [0, boardSize]
      ]
    },
    {
      name: 'submarine',
      directions: [
        [0, 1, 2],
        [0, boardSize, boardSize*2]
      ]
    },
    {
      name: 'cruiser',
      directions: [
        [0, 1, 2],
        [0, boardSize, boardSize*2]
      ]
    },
    {
      name: 'battleship',
      directions: [
        [0, 1, 2, 3],
        [0, boardSize, boardSize*2, boardSize*3]
      ]
    },
    {
      name: 'carrier',
      directions: [
        [0, 1, 2, 3, 4],
        [0, boardSize, boardSize*2, boardSize*3, boardSize*4]
      ]
    },)

    App.contracts.Battleship.deployed().then(async function (instance){
      battleshipInstance = instance;
      return battleshipInstance.createGame(boardSize, {value: (grandPrize)})
    }).then(async function (logArray) {
      gameId = logArray.logs[0].args._gameId.toNumber();
      if (gameId < 0) {
        console.error("Something went wrong, game id is negative!");
      }
      else {
        App.handleGameEvents();
      }
    }).catch(function (err) {
      console.error(err);
    });
  },

  createBoard: function(grid, squares, width){
    for (let i = 0; i < width*width; i++) {
      const square = document.createElement('div');
      square.dataset.id = i;
      grid.appendChild(square);
      grid.style="grid-template-rows: repeat("+width+", 4.6vmin);grid-template-columns: repeat("+width+", 4.6vmin)";
      squares.push(square);
    }
  },

  findGame: function(){
    if(!gameId){ 
      App.contracts.Battleship.deployed().then(async function (instance){
        battleshipInstance=instance;
        return battleshipInstance.joinRandomGame();
      }).then(async function (logArray){
        gameId = logArray.logs[0].args._gameId.toNumber();
        boardSize = logArray.logs[0].args._boardSize.toNumber();
        grandPrize = logArray.logs[0].args._grandPrize.toNumber();
        if (gameId < 0) {
          console.error("Something went wrong, game id is negative!");
        }
        else {
          setUpJoinGameDiv.style.display='none';
          acceptGameConditionDiv.style.display='block';
          document.querySelector('#game-id-cond').innerText='GAME ID: '+gameId;
          document.querySelector('#board-size-cond').innerText='Board size: '+boardSize;
          document.querySelector('#grand-prize-cond').innerText='Grand prize: '+grandPrize+' ETH';
        }
      }).catch(function (err) {
        console.error(err);
      });
    } else if(gameId<=0){
      alert("Game ID has to be grather than 0 or empty for a random game!");
      return;
    } else { $('#ships-board').show();
      App.contracts.Battleship.deployed().then(async function (instance){
        battleshipInstance=instance;
        return battleshipInstance.joinGameByGameId(gameId);
      }).then(async function (logArray){
        gameId = logArray.logs[0].args._gameId.toNumber();
        boardSize = logArray.logs[0].args._boardSize.toNumber();
        grandPrize = logArray.logs[0].args._grandPrize.toNumber();
        if (gameId < 0) {
          console.error("Something went wrong, game id is negative!");
        }
        else {
          setUpJoinGameDiv.style.display='none';
          acceptGameConditionDiv.style.display='block';
          document.querySelector('#game-id-cond').innerText='GAME ID: '+gameId;
          document.querySelector('#board-size-cond').innerText='Board size: '+boardSize;
          document.querySelector('#grand-prize-cond').innerText='Grand prize: '+grandPrize+' ETH';
        }
      }).catch(function (err) {
        console.error(err);
      });
      
    }
    
  },

  acceptGameCondition: function(){
    console.log("Game conditions accepted!");
    App.contracts.Battleship.deployed().then(async function (instance){
      battleshipInstance=instance;
      return battleshipInstance.setOpponent(gameId, {value: (grandPrize)});
    })
    App.handleGameEvents();
  },

  quitGame: function(){
    console.log("Game conditions rejected")
    App.contracts.Battleship.deployed().then(async function (instance){
      battleshipInstance=instance;
      return battleshipInstance.quitGame(gameId);
    })
  },

  rotate: function(){
    if (isHorizontal) {
      destroyer.classList.toggle('destroyer-container-vertical')
      submarine.classList.toggle('submarine-container-vertical')
      cruiser.classList.toggle('cruiser-container-vertical')
      battleship.classList.toggle('battleship-container-vertical')
      carrier.classList.toggle('carrier-container-vertical')
      isHorizontal = false
      return
    }
    if (!isHorizontal) {
      destroyer.classList.toggle('destroyer-container-vertical')
      submarine.classList.toggle('submarine-container-vertical')
      cruiser.classList.toggle('cruiser-container-vertical')
      battleship.classList.toggle('battleship-container-vertical')
      carrier.classList.toggle('carrier-container-vertical')
      isHorizontal = true
      // console.log(isHorizontal)
      return
    }
  },

  dragStart: function() {
    draggedShip = this;
    draggedShipLength = this.childNodes.length;
  },

  dragOver: function(e) {
    e.preventDefault();
  },

  dragDrop: function() {
    let shipNameWithLastId = draggedShip.lastChild.id;
    console.log("Placing "+shipNameWithLastId);
    let shipClass = shipNameWithLastId.slice(0, -2);

    let lastShipIndex = parseInt(shipNameWithLastId.substr(-1));
    let shipLastId = lastShipIndex + parseInt(this.dataset.id);

    const notAllowedHorizontal=[];
    for(let i=0;i<4;i++){
      for(let j=0; j<boardSize; j++){
        notAllowedHorizontal.push(i+boardSize*j);
      }
    }

    const notAllowedVertical=[];
    for(let i=0; i<4*boardSize;i++)
      notAllowedVertical.push(boardSize*boardSize-(i+1));
    
    let newNotAllowedHorizontal = notAllowedHorizontal.splice(0, boardSize * lastShipIndex);
    let newNotAllowedVertical = notAllowedVertical.splice(0, boardSize * lastShipIndex);

    selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1));

    shipLastId = shipLastId - selectedShipIndex;

    if (isHorizontal && !newNotAllowedHorizontal.includes(shipLastId)) {
      for (let i=0; i < draggedShipLength; i++) {
        let directionClass;
        if (i === 0) 
          directionClass = 'start';
        if (i === draggedShipLength - 1)
          directionClass = 'end';
        if(userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.contains('taken'))
          return;
        userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken', 'horizontal', directionClass, shipClass);
      }
    //As long as the index of the ship you are dragging is not in the newNotAllowedVertical array! This means that sometimes if you drag the ship by its
    //index-1 , index-2 and so on, the ship will rebound back to the displayGrid.
    } else if (!isHorizontal && !newNotAllowedVertical.includes(shipLastId)) {
      for (let i=0; i < draggedShipLength; i++) {
        let directionClass;
        if (i === 0)
          directionClass = 'start';
        if (i === draggedShipLength - 1)
          directionClass = 'end';
        if(userSquares[parseInt(this.dataset.id) - selectedShipIndex + boardSize*i].classList.contains('taken'))
          return;
        userSquares[parseInt(this.dataset.id) - selectedShipIndex + boardSize*i].classList.add('taken', 'vertical', directionClass, shipClass);
      }
    } else {
      return;
    }

    grid_display.removeChild(draggedShip);
    if(!grid_display.querySelector('.ship'))
      allShipsPlaced = true;
  },

  startGame: function(){
    if(!allShipsPlaced){
      return alert("Before starting the game place all your ship!");
    }

    for(let i=0; i<boardSize; i++){
      let row=[];
      for(let j=0; j<boardSize; j++){
        if(userSquares[i*boardSize+j].classList.contains('taken')){
          row[j]=1;
        } else {
          row[j]=0;
        }
      }
      userBoardMatrix.push(row);
    }

    merkleTree=App.buildMerkleTree(userBoardMatrix);
    merkleRoot=merkleTree.merkleRoot[0];
    App.contracts.Battleship.deployed().then(async function (instance){
      battleshipInstance=instance;
      return battleshipInstance.setMerkleRoot(gameId, merkleRoot);
    })
  },

  handleGameEvents: async function(){
    let currentBlock=null;

    await battleshipInstance.allEvents(
      (errors, events) => {
        if(events.event=="gameCreated" || events.event=="gameJoined" && events.args._gameId.toNumber() == gameId && events.blockNumber != currentBlock){
          currentBlock=events.event.blockNumber;
          if(events.args._from==web3.eth.defaultAccount){
            userInfo.querySelector('.connected').classList.toggle('active');
            welcomePage.style.display='none';
            homeBtn.style.display='none';
            gamePage.style.display='block';
            if(events.event=="gameCreated"){
              console.log("---Handling gameCreated event---");
              playerInfo.innerText="Game with ID "+ gameId + " created. Wait for an opponent!";
              playerTurn.style.display='none';
            } else if (events.event=="gameJoined"){
              console.log("---Handling gameJoined event---");
              opponentInfo.querySelector('.connected').classList.toggle('active');
            }
            App.createBoard(user_grid, userSquares, boardSize);
            App.createBoard(opponent_grid, opponentSquares, boardSize);
          } else {
            opponentInfo.querySelector('.connected').classList.toggle('active');
          }        
          if(userInfo.querySelector('.connected').classList.contains('active') &&
            opponentInfo.querySelector('.connected').classList.contains('active')){
              playerInfo.innerText=" ";
              userSquares.forEach(square => {
                square.addEventListener('dragover', App.dragOver);
                square.addEventListener('drop', App.dragDrop);
              });
            }
        } else if(events.event=="gameReady" && events.args._gameId.toNumber() == gameId && events.blockNumber != currentBlock){
          currentBlock=events.event.blockNumber;
          console.log("---Handling gameReady event---");
          if(events.args._player==web3.eth.defaultAccount){
            userInfo.querySelector('.ready').classList.toggle('active');
          } else {
            opponentInfo.querySelector('.ready').classList.toggle('active');
          }

          if(userInfo.querySelector('.ready').classList.contains('active') &&
            opponentInfo.querySelector('.ready').classList.contains('active')){
            playerTurn.style.display='block';
            if(web3.eth.defaultAccount==events.args._playerTurn){
              playerTurn.innerText='Your go';
              userTurn=true;
            } else {
              playerTurn.innerText='Opponent go';
            }
            opponentSquares.forEach(square => {
              square.addEventListener('click', App.shot)
            });
          }
        } else if(events.event=='shotEvent' && events.args._gameId.toNumber() == gameId && events.blockNumber != currentBlock){
          currentBlock=events.event.blockNumber;
          console.log("---Handling shotEvent event---");

          if(events.args._player==web3.eth.defaultAccount){
            App.handleShot(events.args._shotSquareId.toNumber());
          }
        } else if(events.event=='shotResultEvent' && events.args._gameId.toNumber()==gameId && events.blockNumber!=currentBlock){
          currentBlock=events.event.blockNumber;
          console.log("---Handling shotResultEvent event---");

          if(events.args._player==web3.eth.defaultAccount){
            shotResult=events.args._shotResult.toNumber();
            console.log(shotResult);
            if(shotResult==1){
              opponentSquares[events.args._shotSquareId.toNumber()].classList.toggle('boom');
              console.log(events.args._sunk);
              if(events.args._sunk!=""){
                playerInfo.innerText="You have sunk the "+events.args._sunk;
                setTimeout(playerInfo.innerText=" ", 10000);
              }
            } else {
              opponentSquares[events.args._shotSquareId.toNumber()].classList.toggle('miss');
            }
            userTurn=false;
            playerTurn.innerText='Opponent go';
          }
        } else if(events.event=='gameEnded' && events.args._gameId.toNumber()==gameId && events.blockNumber!=currentBlock) {
          currentBlock=events.event.blockNumber;
          console.log("---Handling gameEnded event---");
          
          if(events.args._cheat.toNumber()==1)
            console.log("The loser has cheated");

          if(events.args._winner==web3.eth.defaultAccount){
            console.log("Game ended. YOU WON!")
            playerInfo.innerText="Game ended. YOU WON!";
          } else if(events.args._loser==web3.eth.defaultAccount){
            console.log("Game ended. You lose!")
            playerInfo.innerText="Game ended. You lose!";
          }
        }
      }
    )
  },

  shot: async function(){
    const shotSquareId=this.dataset.id;
    console.log("Shot square with ID ", shotSquareId);
    App.contracts.Battleship.deployed().then(async function (instance){
      battleshipInstance=instance;
      return battleshipInstance.shot(gameId, shotSquareId);
    })
  },

  handleShot: function(shotSquareId){
    const row=Math.floor(shotSquareId/boardSize);
    const col=Math.floor(shotSquareId-row*boardSize);
    if(userBoardMatrix[row][col]==1){
      shotFire=1;
      userSquares[shotSquareId].classList.toggle('boom');

      if(userSquares[shotSquareId].classList.contains('destroyer')){
        destroyerCount++;
        sunk = destroyerCount==2 ? "destroyer" : "";
      } else if(userSquares[shotSquareId].classList.contains('submarine')){
        submarineCount++;
        sunk = destroyerCount==3 ? "submarine" : "";
      } else if(userSquares[shotSquareId].classList.contains('cruiser')){
        cruiserCount++;
        sunk = destroyerCount==3 ? "cruiser" : "";
      } else if(userSquares[shotSquareId].classList.contains('battleship')){
        battlehsipCount++;
        sunk = destroyerCount==4 ? "battleship" : "";
      } else if(userSquares[shotSquareId].classList.contains('carrier')){
        cruiserCount++;
        sunk = destroyerCount==5 ? "carrier" : "";
      } 
    } else {
      shotFire=0;
      userSquares[shotSquareId].classList.toggle('miss');
    }

    const merkleProof=App.generateMerkleProof(merkleTree.tree, shotSquareId);
    const hashedLeaf=merkleTree.tree[0][shotSquareId];

    App.contracts.Battleship.deployed().then(async function (instance){
      battleshipInstance=instance;
      return battleshipInstance.shotResult(gameId, shotFire, sunk, shotSquareId, hashedLeaf, merkleProof);
    }).then(async function (logArray) {
      shotFire=-1;
      playerTurn.innerText='Your go';
    }).catch(function (err) {
      console.log(err.message);
    });
  },

  calculateMerkleRoot: function(hashedLeaf, merkleProof){
    console.log("Calculating merkle root")
    let computedHash = hashedLeaf;
    for (let i = 0; i < merkleProof.length; i++) {
      const proofElement = merkleProof[i];
      const combinedElement=App.XOR(computedHash,proofElement);
      computedHash = window.web3Utils.soliditySha3(combinedElement);
    }

    return computedHash;
  },

  completeLeavesWithEmptyValues: function(leaves) {
    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(leaves.length)));
    const completedLeaves = [...leaves];
    
    while (completedLeaves.length < nextPowerOfTwo) {
      completedLeaves.push(window.web3Utils.soliditySha3("")); //Add the empty leaf
    }
    
    return completedLeaves;
  },

  //Function to build the Merkle tree
  buildMerkleTree: function(userBoardMatrix) {
    const leafHashes = [];
  
    for (let i = 0; i < userBoardMatrix.length; i++) {
      for (let j = 0; j < userBoardMatrix[i].length; j++) {
        const cellValue = userBoardMatrix[i][j];
        const salt = Math.floor(Math.random() * 10000);
        const leafData = JSON.stringify(cellValue) + salt;
        const leafHash = window.web3Utils.soliditySha3(leafData);
        leafHashes.push(leafHash);
      }
    }
  
    const completedLeafHashes = App.completeLeavesWithEmptyValues(leafHashes);
    const tree = [];
    tree.push(completedLeafHashes)
  
    let levelHashes = completedLeafHashes;
    while (levelHashes.length > 1) {
      const newLevelHashes = [];
      for (let i = 0; i < levelHashes.length; i += 2) {
        const combinedData = App.XOR(levelHashes[i], levelHashes[i + 1]);
        const combinedHash = window.web3Utils.soliditySha3(combinedData);
        newLevelHashes.push(combinedHash);
      }
      tree.push(newLevelHashes);
      levelHashes = newLevelHashes;
    }
  
    const merkleRoot = tree[tree.length - 1];
    return {
      merkleRoot: merkleRoot,
      tree: tree
    };
  },

  XOR: function (leaf1, leaf2) {
  var BN = window.web3Utils.BN;
  var a = new BN(leaf1.slice(2), 16); // Rimuovi il prefisso "0x" dalla stringa
  var b = new BN(leaf2.slice(2), 16); // Rimuovi il prefisso "0x" dalla stringa
  var xorResult = a.xor(b).toString(16);
  var paddedResult = '0x' + xorResult.padStart(64, '0'); // Aggiungi padding per ottenere una stringa di lunghezza 64
  return paddedResult;
},
  //Function to generate the Merkle Proof
  generateMerkleProof: function(tree, index) {
    console.log("Generating MerkleProof");
    const proof = [];
    let levelIndex = index;
  
    for (let i = 0; i < tree.length - 1; i ++) {
      if (levelIndex % 2 === 0) {
        proof.push(tree[i][levelIndex+1]);
        levelIndex = Math.floor(levelIndex / 2);
      } else {
        proof.push(tree[i][levelIndex-1]);
        levelIndex = Math.floor((levelIndex-1) / 2);
      }
    }

    console.log("Merkle Proof Generated");
    return proof;
  },
  
  sleep: function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
