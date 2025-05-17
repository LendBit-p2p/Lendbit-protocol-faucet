// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/TestnetFaucet.sol";

contract DeployTestnetFaucet is Script {
    address private constant WETH = 0xAB6015514c40F5B0bb583f28c0819cA79e3B9415;
    address private constant USDC = 0x00D1C02E008D594ebEFe3F3b7fd175850f96AEa0;
    address private constant LINK = 0x9b76e44C8d3a625D0d5e9a04227dc878B31897C2;
    address private constant DAI = 0xb0dbA4BDEC9334f4E9663e9b9941E37018BbE81a;

    function run() public {
        vm.startBroadcast();
        TestnetFaucet faucet = TestnetFaucet(
            0xef1cc9674b940cc3C8A4Cc46ea3D05eDCb8e9070
        );
        // console.log("Deploying TestnetFaucet", address(faucet));
        // MintableERC20(WETH).mint(address(faucet), 1000000 ether);
        // MintableERC20(LINK).mint(address(faucet), 1000000 ether);
        // MintableERC20(DAI).mint(address(faucet), 1000000 ether);
        // MintableERC20(USDC).mint(address(faucet), 100000000000000000000E6);

        // faucet.addToken("WETH", WETH, 0.1 ether);
        // faucet.addToken("USDC", USDC, 100E6);
        // faucet.addToken("DAI", DAI, 100E18);
        faucet.addToken("LINK", LINK, 25 ether);
        vm.stopBroadcast();
    }
}

interface MintableERC20 {
    function mint(address to, uint256 amount) external;
}
