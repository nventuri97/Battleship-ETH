var gameId = null;
var grandPrize = null;
var boardSize = null;
var board = null;
var shipsNum = null;

App = {
  web3Provider: null,
  contracts: {},

  init: async function () {

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
    $(document).on('click', '#create-new-game-btn', App.createNewGame);
    $(document).on('click', '#join-game-btn', App.joinGame);
    $(document).on('click', '#send-game-condition-btn', App.setGameCondition);
    $(document).on('click', '#send-game-id-btn', App.findGame);

    $(document).on('input', "#boardSize", (event) => boardSize = event.target.value);
    $(document).on('input', "#shipsNum", (event) => shipsNum = event.target.value);
    $(document).on('input', "#grandPrize", (event) => grandPrize = event.target.value);

    $(document).on('input', '#gameId', (event) => gameId = event.target.value);
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
    if(!boardSize || !grandPrize || !shipsNum)
      return alert("An input parameters is empty, check board size, ships number or grand size!");
    else if(boardSize%2!==0 || boardSize <= 0)
      return alert("The board size is not a multiple of 2 and must be grather than 0, change it!");
    else if(shipsNum<=0)
      return alert("The number of ship has to be grather than 0, change it!");
    else if(grandPrize<=0)
      return alert("The grand prize has to be grather than 0, change it!");

    App.contracts.Battleship.deployed().then(async function (instance){
      battleshipInstance = instance;
      return battleshipInstance.createGame(grandPrize, boardSize, shipsNum)
    }).then(async function (logArray) {
      gameId = logArray.logs[0].args._gameId.toNumber();
      if (gameId < 0) {
        console.error("Something went wrong, game id is negative!");
      }
      else {
        $('#set-up-new-game').hide();
        $('#welcome-page').text("Waiting for an opponents! The Game ID is " + gameId + "!");
      }
    }).catch(function (err) {
      console.error(err);
    });
  },

  findGame: function(){
    if(!gameId){ 
      // Cerca gioco random dal contratto
    } else if(gameId<=0){
      alert("Game ID has to be grather than 0 or empty for a random game!");
      return;
    } else {
      // Cercare il gioco per ID
    }

    $('#set-up-join-game').hide();
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
