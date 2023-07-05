var gameId = null;
var grandPrize = null;
var boardSize = null;
var board = null;
var angle=0;
const user_grid=document.getElementById('user-grid');
const opponent_grid=document.getElementById('opponent-grid');
const rotate_btn=document.querySelector('#rotate');
const grid_display=document.querySelector('.grid-display');
const userSquares=[];
const opponentSquares=[];

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
    $(document).on('click', '#back-home-btn', App.backHome);
    $(document).on('click', '#create-new-game-btn', App.createNewGame);
    $(document).on('click', '#join-game-btn', App.joinGame);
    $(document).on('click', '#send-game-condition-btn', App.setGameCondition);
    $(document).on('click', '#send-game-id-btn', App.findGame);
    $(document).on('click', "#quit-game-btn", App.quitGame);
    rotate_btn.addEventListener('click', App.rotate);

    $(document).on('input', "#boardSize", (event) => boardSize = event.target.value);
    $(document).on('input', "#grandPrize", (event) => grandPrize = event.target.value);

    $(document).on('input', '#gameId', (event) => gameId = event.target.value);
  },

  backHome: function() {
    $('#game-page').hide();
    $('#welcome-page').show();
    $('#set-up-new-game').hide();
    $('#set-up-join-game').hide();
    $('#create-new-game-btn').show();
    $('#join-game-btn').show();
  },

  createNewGame: function() {
    $('#join-game-btn').hide();
    $('#create-new-game-btn').hide();
    $('#set-up-new-game').show();
  },

  joinGame: function() {
    $('#create-new-game-btn').hide();
    $('#join-game-btn').hide();
    $('#set-up-join-game').show();
  },

  setGameCondition: function(){
    // Check to validate the correctness of the parameters from the creation of new game view
    if(!boardSize || !grandPrize)
      return alert("An input parameters is empty, check board size or grand size!");
    else if(boardSize <= 5 || boardSize>12)
      return alert("The board size has to be grather or equals to 5 and equals or minor to 12, change it!");
    else if(grandPrize<=0)
      return alert("The grand prize has to be grather than 0, change it!");

    App.contracts.Battleship.deployed().then(async function (instance){
      battleshipInstance = instance;
      return battleshipInstance.createGame(grandPrize, boardSize)
    }).then(async function (logArray) {
      gameId = logArray.logs[0].args._gameId.toNumber();
      if (gameId < 0) {
        console.error("Something went wrong, game id is negative!");
      }
      else {
        $('#welcome-page').hide();
        $('#game-page').show();
        document.getElementById("wait-game").innerText="Game with ID "+ gameId + " created. Wait for opponents";
        App.createBoard(user_grid, userSquares, boardSize);
        App.createBoard(opponent_grid, opponentSquares, boardSize);
        setTimeout(() => { $('#wait-game').hide(); $('#game-boards').show(); $('#ships-board').show(); $('#game-btns').show() }, 15*1000);
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
        if (gameId < 0) {
          console.error("Something went wrong, game id is negative!");
        }
        else {
          waitTime=logArray.logs[0].args._startTime.toNumber();
          $('#welcome-page').hide();
          $('#game-page').show();
          document.getElementById("wait-game").innerText="Game with ID "+ gameId + " starts in "+waitTime+" seconds";
          setTimeout(() => { $('#wait-game').hide(); $('#game-boards').show(); $('#ships-board').show(); $('#game-btns').show() }, waitTime*1000);
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
          waitTime=logArray.logs[0].args._startTime.toNumber();
          $('#welcome-page').hide();
          $('#game-page').show();
          document.getElementById("wait-game").innerText="Game with ID "+ gameId + " starts in "+waitTime+" seconds";
          setTimeout(() => { $('#wait-game').hide(); $('#game-boards').show( ); $('#ships-board').show(); $('#game-btns')}, waitTime*1000);
        }
      }).catch(function (err) {
        console.error(err);
      });
    }

    $('#set-up-join-game').hide();
  },

  quitGame: function(){

  },

  rotate: function(){
    const ships=Array.from(grid_display.children)
    ships.forEach(ship => ship.style.transform=`rotate(${90-angle}deg)`)
    if(angle===0)
      angle=90;
    else
      angle=0;
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
