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

  //Array of all games present in the blockchain
  mapping(uint256 => Game) public games;
  //Game ID generator counter
  uint256 public gameId=1;
  //Available games counter
  uint256 public availableGames=0;

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
    availableGames++;
    emit returnGameId(msg.sender, game.gameId);
  }

//   function play(uint256 gameId) public returns (uint) {
//     require(gameId>=0 && gameId<=20);

//     return gameId;
//   }
}
