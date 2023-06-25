// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;
// import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

contract Battleship {
  //structure that represent a single game
  struct Game{
    uint256 gameId;
    address player1;
    address player2;
    uint256 grandPrize;
    uint256 boardSize;
    uint256 numberOfShips;
    uint256 remainShipsP1;
    uint256 remainShipsP2;
    address playerTurn;
    uint256 penaltyTimeout;
    address accusedPlayer;
    bool playable;
  }

  event returnGameId(address indexed _from, uint256 _gameId);
  event gameStarted(uint256 _gameId, address indexed _player1, address indexed _player2, uint256 _grandPrize);
  event gameReady(uint256 _gameId, address indexed _player1, address indexed _player2, uint256 _startTime);
  event gameEnded(uint256 _gameId, address indexed _winner, address indexed _looser);
  event accusationTrial(uint256 _gameId, address indexed _accuser, address indexed _accused);
  error eventError(string _message);

  //Array of all games present in the blockchain
  mapping(uint256 => Game) public games;
  //Game ID generator counter
  uint256 public gameId=1;
  //Available games array
  uint256[] public availableGames;

  uint256 public totalGames=0;
  uint256 public START_TIME=15;
  uint256 internal nonce=0;
  Game public game;

  constructor() {}

  function getGameId() public returns (uint256) {
    return gameId++;
  }

  function createGame(uint256 _grandPrize, uint256 _boardSize, uint256 _numberOfShips) public {
    game=Game(getGameId(), 
              msg.sender, 
              address(0),
              _grandPrize,
              _boardSize,
              _numberOfShips,
              _numberOfShips,
              _numberOfShips,
              address(0),
              0,
              address(0),
              true);
    games[game.gameId]=game;
    availableGames.push(game.gameId);
    totalGames++;
    emit returnGameId(msg.sender, game.gameId);
  }

  function joinGameByGameId(uint256 _gameId) public {
    if(games[_gameId].gameId==0)
      revert eventError("No existing game with this ID ");

    game=games[_gameId];
    game.player2=msg.sender;
    game.playable=false;
    deleteElementFromArray(_gameId);
    emit gameReady(_gameId, game.player1, msg.sender, START_TIME);
  }

  function joinRandomGame() public {
    uint256 index=random();
    uint256 i=0;
    while(availableGames[index]==0 && i<10){
      index=random();
      i++;
    }

    if(i==10)
      revert eventError("Something goes wrong, try again!");
    
    game=games[index];
    if(game.playable){
      game.player2=msg.sender;
      game.playable=false;
      deleteElementFromArray(index);
      emit gameReady(index, game.player1, msg.sender, START_TIME);
    } else {
      revert eventError("Something goes wrong, try again!");
    }
    
  }

  function deleteElementFromArray(uint256 _element) internal {
    for(uint256 i=0;i<availableGames.length;i++){
      if(availableGames[i]==_element){
        availableGames[i]=availableGames[availableGames.length-1];
        availableGames.pop();
        break;
      }
    }
  }

  function random() internal returns (uint256) {
    uint256 randomnumber = uint(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % availableGames.length;
    nonce++;
    return randomnumber;
  }
}
