// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TestnetFaucet is Ownable, ReentrancyGuard {

    mapping(string => address) public supportedTokens;

    mapping(string => uint256) public dripAmounts;

    mapping(address => mapping(string => uint256)) public lastRequestTime;

    uint256 public cooldownPeriod = 1 days;

    event TokensRequested(address indexed recipient, string tokenSymbol, uint256 amount);
    event TokenAdded(string tokenSymbol, address tokenAddress, uint256 dripAmount);
    event CooldownPeriodUpdated(uint256 newCooldownPeriod);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Add or update a supported token
     * @param symbol Token symbol (e.g., "WETH")
     * @param tokenAddress Address of the token contract
     * @param amount Amount to drip for each request
     */
    function addToken(string memory symbol, address tokenAddress, uint256 amount) external onlyOwner {
        require(tokenAddress != address(0), "Invalid token address");
        require(amount > 0, "Drip amount must be greater than 0");
        
        supportedTokens[symbol] = tokenAddress;
        dripAmounts[symbol] = amount;
        
        emit TokenAdded(symbol, tokenAddress, amount);
    }

    /**
     * @notice Request tokens from the faucet
     * @param recipient Address to receive the tokens
     * @param symbol Token symbol (e.g., "WETH")
     */
    function requestTokens(address recipient, string memory symbol) public nonReentrant {
        require(recipient != address(0), "Invalid recipient address");
        address tokenAddress = supportedTokens[symbol];
        require(tokenAddress != address(0), "Token not supported");
        
        // Check cooldown - we use the recipient address for cooldown
        require(
            block.timestamp >= lastRequestTime[recipient][symbol] + cooldownPeriod,
            "Please wait for cooldown period to end"
        );
        
        uint256 amount = dripAmounts[symbol];
        IERC20 token = IERC20(tokenAddress);
        
        // Check faucet balance
        require(token.balanceOf(address(this)) >= amount, "Faucet is empty");
        
        // Update last request time for the recipient
        lastRequestTime[recipient][symbol] = block.timestamp;
        
        // Transfer tokens to the recipient
        require(token.transfer(recipient, amount), "Token transfer failed");
        
        emit TokensRequested(recipient, symbol, amount);
    }


    /**
     * @notice Check if a user can request a specific token
     * @param user Address of the user
     * @param tokenSymbol Symbol of the token
     * @return Whether the user can request the token
     */
    function canRequestToken(address user, string memory tokenSymbol) external view returns (bool) {
        return block.timestamp >= lastRequestTime[user][tokenSymbol] + cooldownPeriod;
    }

    /**
     * @notice Update the cooldown period
     * @param newCooldownPeriod New cooldown period in seconds
     */
    function updateCooldownPeriod(uint256 newCooldownPeriod) external onlyOwner {
        cooldownPeriod = newCooldownPeriod;
        emit CooldownPeriodUpdated(newCooldownPeriod);
    }

    /**
     * @notice Get the drip amount for a specific token
     * @param symbol Token symbol (e.g., "WETH")
     * @return The drip amount for the token
     */
    function getDripAmount(string memory symbol) external view returns (uint256) {
        return dripAmounts[symbol];
    }
    
    /**
     * @notice Get remaining time until a user can request a token again
     * @param user Address of the user
     * @param tokenSymbol Symbol of the token
     * @return Time in seconds until the user can request again (0 if can request now)
     */
    function timeUntilNextRequest(address user, string memory tokenSymbol) external view returns (uint256) {
        uint256 lastRequest = lastRequestTime[user][tokenSymbol];
        uint256 nextAvailable = lastRequest + cooldownPeriod;
        
        if (block.timestamp >= nextAvailable) {
            return 0;
        }
        
        return nextAvailable - block.timestamp;
    }
}
