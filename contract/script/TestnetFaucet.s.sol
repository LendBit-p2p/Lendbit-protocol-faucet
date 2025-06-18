// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/TestnetFaucet.sol";

contract DeployTestnetFaucet is Script {

    TestnetFaucet private baseFaucet;
    TestnetFaucet private abritrumFaucet; 
    TestnetFaucet private optimismFaucet;

     
 
    address private constant FAUCET_ADDRESS = 0xB3A0dAB9333Cb7a597d9c11bC89e4Be6b9951fed;

    // Fixed: Updated to proper checksummed addresses
    address private constant BASE_LINK = 0x46d4AafcEd9cc65089D1606e6cAE85fe6D7df456;
    address private constant BASE_DAI = 0xFEa8109D6955c4F3F7930ad57B5798606264BDB0;

    address private constant ARB_LINK = 0x23eb68D3C0472f6892c2d68B0F2A8F0f5282a7ED;
    address private constant ARB_DAI = 0x6bc614678F6B64Fa7F4530C66E03F3DaB8C236a6;

    address private constant OP_LINK = 0xB68D6a420f60FAa64bFE165a3ce9313E734eFD34;
    address private constant OP_DAI = 0x3fE4a6f534aCB3f1fEaf6C7Bc3810cB7eC9136aE;

    function run() public {
        vm.startBroadcast();
        console.log("Deploying TestnetFaucet...");

        // baseFaucet = new TestnetFaucet();
        // console.log("Faucet instance created:", address(baseFaucet));
        // addBaseTokens();

        //  abritrumFaucet = new TestnetFaucet();
        // console.log("Faucet instance created:", address(abritrumFaucet));
        // addArbitrumTokens();

        optimismFaucet = new TestnetFaucet();
        console.log("Faucet instance created:", address(optimismFaucet));
        addOptimismTokens();



        vm.stopBroadcast();
    }

    function addBaseTokens() internal {
        console.log("Adding Ethereum Sepolia tokens...");
        // Add LINK with 25 LINK drip amount
        baseFaucet.addToken("ETH_LINK", BASE_LINK, 25 ether);
        console.log("Added ETH_LINK:", BASE_LINK);
        
        // Add DAI with 100 DAI drip amount
        baseFaucet.addToken("ETH_DAI", BASE_DAI, 10 ether);
        console.log("Added ETH_DAI:", BASE_DAI);
    }

    function addArbitrumTokens() internal {
        console.log("Adding Arbitrum testnet tokens...");
        
        // Add LINK with 25 LINK drip amount
        abritrumFaucet.addToken("ARB_LINK", ARB_LINK, 25 ether);
        console.log("Added ARB_LINK:", ARB_LINK);
        
        // Add DAI with 100 DAI drip amount
        abritrumFaucet.addToken("ARB_DAI", ARB_DAI, 10 ether);
        console.log("Added ARB_DAI:", ARB_DAI);
    }
    
    function addOptimismTokens() internal {
        console.log("Adding Optimism testnet tokens...");

        // Add LINK with 25 LINK drip amount
        optimismFaucet.addToken("OP_LINK", OP_LINK, 25 ether);
        console.log("Added OP_LINK:", OP_LINK);
        
        // Add DAI with 100 DAI drip amount
        optimismFaucet.addToken("OP_DAI", OP_DAI, 10 ether);
        console.log("Added OP_DAI:", OP_DAI);
    }

    
}

interface MintableERC20 {
    function mint(address to, uint256 amount) external;
}