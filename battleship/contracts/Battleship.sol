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
    bool ended;
  }

  event gameCreated(uint256 _gameId, address indexed _from);
  event gameJoined(uint256 _gameId, address indexed _from);
  event gameReady(uint256 _gameId, address indexed _playerTurn, address indexed _player);
  event gameInfo(uint256 _gameId, uint256 _boardSize, uint256 _grandPrize);
  event gameEnded(uint256 _gameId, address indexed _winner, address indexed _looser, uint256 _cheat);
  event shotEvent(uint256 _gameId, address indexed _player, uint256 _shotSquareId);
  event shotResultEvent(uint256 _gameId, address indexed _player, uint256 _shotResult, uint256 _shotSquareId, uint256 _sunk);
  event accusationEvent(uint256 _gameId, address indexed _accuser, address indexed _accused);

  //Array of all games present in the blockchain
  mapping(uint256 => Game) public games;
  //Game ID generator counter
  uint256 public gameId=1;
  //Available games array
  uint256[] public availableGames;

  constructor() {}

  function getGameId() internal returns (uint256) {
    return gameId++;
  }

  function createGame(uint256 _boardSize) public payable {
    Game memory game=Game(getGameId(), 
              msg.sender, 
              address(0),
              msg.value,
              _boardSize,
              5,
              5,
              0,
              0,
              0,
              address(0),
              false);
    games[game.gameId]=game;
    availableGames.push(game.gameId);

    emit gameCreated(game.gameId, msg.sender);
  }

  function joinGameByGameId(uint256 _gameId) public {
    require(_gameId > 0, "Game ID is negative");
      
    Game memory game=games[_gameId];
    emit gameInfo(_gameId, game.boardSize, game.grandPrize);
  }

  function joinRandomGame() public {
    require(availableGames.length > 0, "No available games");

    uint256 index=random();
    uint256 i=0;
    while(availableGames[index]==0 && i<10){
      index=random();
      i++;
    }

    require(i < 10, "Something goes wrong, try again!");

    Game memory game=games[index];
    emit gameInfo(game.gameId, game.boardSize, game.grandPrize);
  }

  function setOpponent(uint256 _gameId) public payable{
    require(_gameId > 0, "Game id is negative!");
    Game storage game=games[_gameId];

    game.player2=msg.sender;
    game.grandPrize+=msg.value;
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

    emit gameReady(_gameId, game.player1, msg.sender);
  }

  function shot(uint256 _gameId, uint256 _shotSquareId) public{
    require(_gameId > 0, "Game id is negative!");

    Game memory game=games[_gameId];
    if(msg.sender==game.player1)
      emit shotEvent(_gameId, game.player2, _shotSquareId);
    else
      emit shotEvent(_gameId, game.player1, _shotSquareId);

    if(game.accusedPlayer==msg.sender){
      game.penaltyTimeout=0;
      game.accusedPlayer=address(0);
    }
  }

  function shotResult(uint256 _gameId, uint256 _shotResult, uint256 _sunk, uint256 _shotSquareId, bytes32 _hashedLeaf, bytes32[] calldata _merkleProof) public {
    require(_gameId > 0, "Game id is negative!");
    require(_shotResult==0 || _shotResult ==1, "Game result not valid");
    require(_shotSquareId >= 0, "Shot square ID not valid");
    require(_hashedLeaf!=0, "Hashed Leaf must be not empty");
    require(_merkleProof.length >= 1, "Merkle proof must not be empty");

    Game memory game=games[_gameId];
    address shoter;
    bytes32 merkleRoot;
    if(msg.sender==game.player1){
      shoter=game.player2;
      merkleRoot=game.p1MerkleRoot;
      if(_sunk==1){
        game.remainShipsP1--;
      }
    } else {
      shoter=game.player1;
      merkleRoot=game.p2MerkleRoot;
      if(_sunk==1){
        game.remainShipsP2--;
      }    
    }

    bytes32 calculatedMerkleRoot=getMerkleRoot(_hashedLeaf, _merkleProof);

    if(merkleRoot==calculatedMerkleRoot){
      emit shotResultEvent(_gameId, shoter, _shotResult, _shotSquareId, _sunk);

      if(game.remainShipsP2==0){
        emit gameEnded(_gameId, game.player1, game.player2, 0);

        payable(game.player1).transfer(game.grandPrize);
        game.grandPrize = 0;
      }
      
      if(game.remainShipsP1==0){
        emit gameEnded(_gameId, game.player2, game.player1, 0);

        payable(game.player2).transfer(game.grandPrize);
        game.grandPrize = 0;
      }
    } else {
      emit gameEnded(_gameId, shoter, msg.sender, 1);
      payable(shoter).transfer(game.grandPrize);
      game.grandPrize = 0;
      game.ended = true;
    }
    
  }

  function getMerkleRoot(bytes32 _hashedLeaf, bytes32[] calldata _merkleProof) internal pure returns (bytes32) {
    bytes32 computedHash = _hashedLeaf;

    for (uint256 i = 0; i < _merkleProof.length; i++) {
        computedHash = keccak256(abi.encodePacked(computedHash^_merkleProof[i]));
    }

    return computedHash;
  }

  function quitGame(uint256 _gameId) public {
    require(_gameId > 0, "Game ID is negative!");

    Game memory game=games[_gameId];

    if(msg.sender==game.player1){
      emit gameEnded(_gameId, game.player2, game.player1, 0);

      payable(game.player2).transfer(game.grandPrize);
      game.grandPrize = 0;
    }else if(msg.sender==game.player2){
      emit gameEnded(_gameId, game.player1, game.player2, 0);
      
      payable(game.player1).transfer(game.grandPrize);
      game.grandPrize = 0;
    }
  }

  function accuseOpponent(uint256 _gameId) public {
    require(_gameId > 0, "Game ID is negative");

    Game memory game=games[_gameId];
    if(game.accusedPlayer==address(0)){
      game.penaltyTimeout=block.number+5;
      if(msg.sender==game.player1){
        game.accusedPlayer=game.player2;
        emit accusationEvent(_gameId, game.player1, game.player2);
      } else {
        game.accusedPlayer=game.player1;
        emit accusationEvent(_gameId, game.player2, game.player1);
      }
    }
  }

  function accuseCheck(uint256 _gameId) public payable{
    require(_gameId > 0, "Game ID is negative");

    Game memory game=games[_gameId];
    if(game.accusedPlayer==game.player1){
      if(game.penaltyTimeout<=block.number){
        payable(game.player2).transfer(game.grandPrize);
        emit gameEnded(_gameId, game.player2, game.player1, 0);
      }
    } else {
      if(game.penaltyTimeout<=block.number){
        payable(game.player1).transfer(game.grandPrize);
        emit gameEnded(_gameId, game.player1, game.player2, 0);
      }
    }
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
    return uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, block.coinbase))) % availableGames.length;
  }
}
