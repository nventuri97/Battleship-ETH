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
    return App.initContract();
  },

  initContract: function () {
    /*
     * Replace me...
     */
    $.getJSON("Adoption.json", function (data) {
      var AdoptionArtifact = data;
      // Get the contract artifact and initialize it
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);

      // Set the web3.js provider for our contract to the provider defined in the previous function
      App.contracts.Adoption.setProvider(App.web3Provider);

      // Use the contract to retrieve and mark the adopted pets
      return App.markAdopted();
    });

    return App.bindEvents();
  },

  bindEvents: async function () {
    $(document).on('click', '#create-new-game-btn', App.createNewGame);
    $(document).on('click', '#join-game-btn', App.joinGame);
    $(document).on('click', '#send-game-condition-btn', App.setGameCondition);
    $(document).on('click', '#send-game-condition-btn', App.findGame)

    $(document).on('input', "#boardSize", (event) => boardSize = event.target.value);
    $(document).on('input', "#shipsNum", (event) => shipsNum = event.target.value);
    $(document).on('input', "#grandPrize", (event) => grandPrize = event.target.value);
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
    if(!boardSize || !grandPrize || !shipsNum){
      alert("An input parameters is empty, check board size, ships number or grand size!");
      return;
    } else if(boardSize%2!==0 || boardSize <= 0){
      alert("The board size is not a multiple of 2 and must be grather than 0, change it!");
      return;
    } else if(shipsNum<=0){
      alert("The number of ship has to be grather than 0, change it!");
      return;
    }else if(grandPrize<=0){
      alert("The grand prize has to be grather than 0, change it!")
      return;
    }

    $('#set-up-new-game').hide()
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
