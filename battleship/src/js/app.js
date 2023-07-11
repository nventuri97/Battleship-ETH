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
const ships=Array.from(grid_display.children);
const allUserBlocks=document.querySelectorAll('#user-grid div');
const quitBtn=document.querySelector('#quit-game-btn');

var gameId = null;
var grandPrize = null;
var boardSize = null;
var board = null;
var angle=0;
const userSquares=[];
const opponentSquares=[];
var draggedShip;
var ready=false;
var opponentReady=false;
let isHorizontal = true;
let allShipsPlaced=false;
let shotFire=-1
let userConnectedPlayers=[false, false]
let opponentConnectedPlayers=[false, false]
let userReadyPlayers=[false, false]
let opponentReadyPlayers=[false, false]

//Ships
var shipArray = []

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

      // Use the contract to retrieve and mark the adopted pets
      //return App.markAdopted();
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
    quitBtn.addEventListener('click', App.quitGame);
    rotate_btn.addEventListener('click', App.rotate);

    ships.forEach(ship => ship.addEventListener('dragstart', App.dragStart));
    allUserBlocks.forEach(userBlock => {
      userBlock.addEventListener('dragover', App.dragOver);
      userBlock.addEventListener('dragover', App.dragEnter);
      userBlock.addEventListener('drop', App.dragDrop);
    })

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
    shipArray=[{
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
    },]

    App.contracts.Battleship.deployed().then(async function (instance){
      battleshipInstance = instance;
      return battleshipInstance.createGame(grandPrize, boardSize)
    }).then(async function (logArray) {
      gameId = logArray.logs[0].args._gameId.toNumber();
      if (gameId < 0) {
        console.error("Something went wrong, game id is negative!");
      }
      else {
        welcomePage.style.display='none';
        // setUpNewGameDiv.style.display='none';
        gamePage.style.display='block';
        document.getElementById('info').innerText="Game with ID "+ gameId + " created. Wait for an opponent!";
        $('#whose-go').hide();
        App.createBoard(user_grid, userSquares, boardSize);
        App.createBoard(opponent_grid, opponentSquares, boardSize);
      }
    }).catch(function (err) {
      console.error(err);
    });
    userConnectedPlayers[0]=true;
    // opponentConnectedPlayers[1]=true;
    App.playerConnection();
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
    App.contracts.Battleship.deployed().then(async function (instance){
      battleshipInstance=instance;
      return battleshipInstance.setOpponent(gameId);
    }).then(async function (logArray){
      welcomePage.style.display='none';
      gamePage.style.display='block';
      App.createBoard(user_grid, userSquares, boardSize);
      App.createBoard(opponent_grid, opponentSquares, boardSize);
    }).catch(function (err) {
      console.error(err);
    });
    opponentConnectedPlayers[0]=true;
    userConnectedPlayers[1]=true;
    App.playerConnection();
  },

  quitGame: function(){

  },

  rotate: function(){
    ships.forEach(ship => ship.style.transform=`rotate(${90-angle}deg)`)
    if(angle===0)
      angle=90;
    else
      angle=0;
  },

  dragStart: function() {
    draggedShip = this
    draggedShipLength = this.childNodes.length
  },

  dragOver: function(e) {
    e.preventDefault()
  },

  dragEnter: function(e) {
    e.preventDefault()
  },

  dragDrop: function() {
    let shipNameWithLastId = draggedShip.lastChild.id
    let shipClass = shipNameWithLastId.slice(0, -2)

    let lastShipIndex = parseInt(shipNameWithLastId.substr(-1))
    let shipLastId = lastShipIndex + parseInt(this.dataset.id)

    const notAllowedHorizontal = [0,10,20,30,40,50,60,70,80,90,1,11,21,31,41,51,61,71,81,91,2,22,32,42,52,62,72,82,92,3,13,23,33,43,53,63,73,83,93]
    const notAllowedVertical = [99,98,97,96,95,94,93,92,91,90,89,88,87,86,85,84,83,82,81,80,79,78,77,76,75,74,73,72,71,70,69,68,67,66,65,64,63,62,61,60]
    
    let newNotAllowedHorizontal = notAllowedHorizontal.splice(0, 10 * lastShipIndex)
    let newNotAllowedVertical = notAllowedVertical.splice(0, 10 * lastShipIndex)

    selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1))

    shipLastId = shipLastId - selectedShipIndex
    // console.log(shipLastId)

    if (isHorizontal && !newNotAllowedHorizontal.includes(shipLastId)) {
      for (let i=0; i < draggedShipLength; i++) {
        let directionClass
        if (i === 0) directionClass = 'start'
        if (i === draggedShipLength - 1) directionClass = 'end'
        userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken', 'horizontal', directionClass, shipClass)
      }
    //As long as the index of the ship you are dragging is not in the newNotAllowedVertical array! This means that sometimes if you drag the ship by its
    //index-1 , index-2 and so on, the ship will rebound back to the displayGrid.
    } else if (!isHorizontal && !newNotAllowedVertical.includes(shipLastId)) {
      for (let i=0; i < draggedShipLength; i++) {
        let directionClass
        if (i === 0) directionClass = 'start'
        if (i === draggedShipLength - 1) directionClass = 'end'
        userSquares[parseInt(this.dataset.id) - selectedShipIndex + width*i].classList.add('taken', 'vertical', directionClass, shipClass)
      }
    } else return

    displayGrid.removeChild(draggedShip)
    if(!displayGrid.querySelector('.ship')) allShipsPlaced = true
  },

  playerConnection: function(){
    for(let i=0; i<userConnectedPlayers.length; i++)
      if(userConnectedPlayers[i])
        document.querySelector(`.p${i+1} .connected`).classList.toggle('active');
    for(let i=0; i<opponentConnectedPlayers.length; i++)
      if(opponentConnectedPlayers[i])
        document.querySelector(`.p${i+1} .connected`).classList.toggle('active');
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
