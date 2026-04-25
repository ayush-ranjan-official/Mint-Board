// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockOracle - Simulates oracle price feed for testnet demo
/// @notice Returns a fixed price for INIT/USD. Owner can update for demo flexibility.
contract MockOracle is Ownable {
    // Price stored with 18 decimals (e.g., 2e18 = $2.00)
    uint256 public price;
    uint256 public lastUpdated;

    event PriceUpdated(uint256 newPrice, uint256 timestamp);

    constructor(uint256 _initialPrice) Ownable(msg.sender) {
        price = _initialPrice;
        lastUpdated = block.timestamp;
    }

    /// @notice Get the current price for a pair
    function getPrice(string calldata /* pair */) external view returns (uint256, uint256) {
        return (price, lastUpdated);
    }

    /// @notice Owner updates price (for demo purposes)
    function setPrice(uint256 _price) external onlyOwner {
        require(_price > 0, "Price must be positive");
        price = _price;
        lastUpdated = block.timestamp;
        emit PriceUpdated(_price, block.timestamp);
    }
}
