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
    uint256 remainShipsP1;
    uint256 remainShipsP2;
    bytes32 p1MerkleRoot;
    bytes32 p2MerkleRoot;
    uint256 penaltyTimeout;
    address accusedPlayer;
    bool playable;
  }

  event gameCreated(uint256 _gameId, address indexed _from);
  event gameJoined(uint256 _gameId, address indexed _from);
  event gameReady(uint256 _gameId, address _playerTurn, bytes32 _merkleRoot);
  event gameInfo(uint256 _gameId, uint256 _boardSize, uint256 _grandPrize);
  event gameEnded(uint256 _gameId, address indexed _winner, address indexed _looser);
  event shotEvent(uint256 _gameId, address indexed _player, uint256 _shotSquareId);
  event shotResultEvent(uint256 _gameId, address indexed _player, uint256 _shotResult, uint256 _shotSquareId);
  event accusationTrial(uint256 _gameId, address indexed _accuser, address indexed _accused);

  //Array of all games present in the blockchain
  mapping(uint256 => Game) public games;
  //Game ID generator counter
  uint256 public gameId=1;
  //Available games array
  uint256[] public availableGames;

  uint256 public totalGames=0;

  constructor() {}

  function getGameId() public returns (uint256) {
    return gameId++;
  }

  function createGame(uint256 _grandPrize, uint256 _boardSize) public {
    Game memory game=Game(getGameId(), 
              msg.sender, 
              address(0),
              _grandPrize,
              _boardSize,
              5,
              5,
              0,
              0,
              0,
              address(0),
              true);
    games[game.gameId]=game;
    availableGames.push(game.gameId);
    totalGames++;
    emit gameCreated(game.gameId, msg.sender);
  }

  function joinGameByGameId(uint256 _gameId) public {
    require(games[_gameId].gameId != 0, "No existing game with this ID");
    require(games[_gameId].playable, "Selected game is not playable");
      
    Game memory game=games[_gameId];
    emit gameInfo(_gameId, game.boardSize, game.grandPrize);
  }

  function joinRandomGame() public {
    uint256 index=random();
    uint256 i=0;
    while(availableGames[index]==0 && i<10){
      index=random();
      i++;
    }

    require(i < 10, "Something goes wrong, try again!");

    Game memory game=games[index];
    require(game.playable, "Something goes wrong, try again!");
    emit gameInfo(game.gameId, game.boardSize, game.grandPrize);
  }

  function setOpponent(uint256 _gameId) public{
    require(_gameId > 0, "Game id is negative!");
    Game storage game=games[_gameId];

    game.player2=msg.sender;
    game.playable=false;
    emit gameJoined(_gameId, msg.sender);
  }

  function setMerkleRoot(uint256 _gameId, bytes32 _merkleRoot) public{
    require(_gameId > 0, "Game id is negative!");
    Game storage game=games[_gameId];

    if(msg.sender==game.player1){
      game.p1MerkleRoot=_merkleRoot;
    } else if(msg.sender==game.player2) {
      game.p2MerkleRoot=_merkleRoot;
    } else {
      revert("Player address is not valid");
    }

    emit gameReady(_gameId, game.player1, _merkleRoot);
  }

  function shot(uint256 _gameId, uint256 _shotSquareId) public{
    require(_gameId > 0, "Game id is negative!");

    Game memory game=games[_gameId];
    if(msg.sender==game.player1)
      emit shotEvent(_gameId, game.player2, _shotSquareId);
    else
      emit shotEvent(_gameId, game.player1, _shotSquareId);
  }

  function shotResult(uint256 _gameId, uint256 _shotResult, uint256 _shotSquareId, bytes32[] memory _merkleProof, bytes32 _merkleRoot) public {
    require(_gameId > 0, "Game id is negative!");

    Game memory game=games[_gameId];
    address shoter;
    if(msg.sender==game.player1){
      shoter=game.player2;
    } else {
      shoter=game.player1;
    }

    emit shotResultEvent(_gameId, shoter, _shotResult, _shotSquareId);
  }

  function deleteElementFromArray(uint256 _element) internal {
    for (uint256 i = 0; i < availableGames.length; i++) {
        if (availableGames[i] == _element) {
            if (i != availableGames.length - 1) {
                availableGames[i] = availableGames[availableGames.length - 1];
            }
            availableGames.pop();
            break;
        }
    }
  }

  function random() internal view returns (uint256) {
    uint256 randomnumber = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, block.coinbase))) % availableGames.length;
    return randomnumber;
  }
}
