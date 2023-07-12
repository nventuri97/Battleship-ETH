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
const destroyer = document.querySelector('.destroyer-container')
const submarine = document.querySelector('.submarine-container')
const cruiser = document.querySelector('.cruiser-container')
const battleship = document.querySelector('.battleship-container')
const carrier = document.querySelector('.carrier-container')
const quitBtn=document.querySelector('#quit-game-btn');

var gameId = null;
var grandPrize = null;
var boardSize = null;
var board = null;
var angle=0;
const userSquares=[];
const opponentSquares=[];
let draggedShip;
let draggedShipLength;
let selectedShipNameWithIndex;
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
        userSquares.forEach(square => {
          square.addEventListener('dragover', App.dragOver);
          square.addEventListener('drop', App.dragDrop);
        });
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
      userSquares.forEach(square => {
        square.addEventListener('dragover', App.dragOver);
        square.addEventListener('drop', App.dragDrop);
      });
    }).catch(function (err) {
      console.error(err);
      //I have to add an event to handle the page during an error
    });
    opponentConnectedPlayers[0]=true;
    userConnectedPlayers[1]=true;
    App.playerConnection();
  },

  quitGame: function(){

  },

  rotate: function(){
    if (isHorizontal) {
      destroyer.classList.toggle('destroyer-container-vertical')
      submarine.classList.toggle('submarine-container-vertical')
      cruiser.classList.toggle('cruiser-container-vertical')
      battleship.classList.toggle('battleship-container-vertical')
      carrier.classList.toggle('carrier-container-vertical')
      isHorizontal = false
      // console.log(isHorizontal)
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
    console.log(shipNameWithLastId);
    let shipClass = shipNameWithLastId.slice(0, -2);

    let lastShipIndex = parseInt(shipNameWithLastId.substr(-1));
    let shipLastId = lastShipIndex + parseInt(this.dataset.id);

    //const notAllowedVertical = [99,98,97,96,95,94,93,92,91,90,89,88,87,86,85,84,83,82,81,80,79,78,77,76,75,74,73,72,71,70,69,68,67,66,65,64,63,62,61,60];

    const notAllowedHorizontal=[];

    for(let i=0;i<4;i++){
      for(let j=0; j<boardSize; j++){
        notAllowedHorizontal.push(i+boardSize*j);
      }
    }

    const notAllowedVertical=[];
    for(let i=0; i<4*boardSize;i++)
      notAllowedVertical.push(boardSize*boardSize-(i+1));

    console.log(notAllowedVertical);
    
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
        userSquares[parseInt(this.dataset.id) - selectedShipIndex + boardSize*i].classList.add('taken', 'vertical', directionClass, shipClass);
      }
    } else {
      return;
    }

    grid_display.removeChild(draggedShip);
    if(!grid_display.querySelector('.ship'))
      allShipsPlaced = true;
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
