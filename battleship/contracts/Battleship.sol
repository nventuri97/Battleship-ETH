// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

library SafeMath {
  function add(uint256 a, uint256 b) internal pure returns (uint256 c) {
    c = a + b;
    assert(c >= a);
    return c;
  }
}

contract Battleship {
  address[20] public games;

  function play(uint256 gameId) public returns (uint) {
    require(gameId>=0 && gameId<=20);

    return gameId;
  }
}
