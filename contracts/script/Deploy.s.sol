// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ContentRegistry.sol";
import "../src/MicroPayment.sol";
import "../src/CurationAgent.sol";
import "../src/MockOracle.sol";

contract DeployMintBoard is Script {
    function run() external {
        vm.startBroadcast();

        // Deploy MockOracle with initial price of $2.00 (2e18)
        MockOracle oracle = new MockOracle(2e18);
        console.log("MockOracle:", address(oracle));

        // Deploy ContentRegistry
        ContentRegistry registry = new ContentRegistry();
        console.log("ContentRegistry:", address(registry));

        // Deploy MicroPayment with registry + umin ERC20 token address
        // On minievm, umin is represented as ERC20 at a known address
        address uminERC20 = 0x1D14AE89516E15E050bf6C4A1f549b9deB5f6EFb;
        MicroPayment payment = new MicroPayment(address(registry), uminERC20);
        console.log("MicroPayment:", address(payment));

        // Deploy CurationAgent with registry + umin ERC20 token address
        CurationAgent curation = new CurationAgent(address(registry), uminERC20);
        console.log("CurationAgent:", address(curation));

        // Wire contracts together
        registry.setPaymentContract(address(payment));
        payment.setCurationAgent(address(curation));
        payment.setOracle(address(oracle));

        console.log("--- Contracts wired successfully ---");

        vm.stopBroadcast();
    }
}
