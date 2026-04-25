// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MicroPayment.sol";
import "../src/ContentRegistry.sol";
import "../src/CurationAgent.sol";
import "../src/MockOracle.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Simple mock ERC20 for testing
contract MockERC20 is ERC20 {
    constructor() ERC20("Mock MIN", "MIN") {
        _mint(msg.sender, 1_000_000 ether);
    }
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MicroPaymentTest is Test {
    ContentRegistry public registry;
    MicroPayment public payment;
    CurationAgent public curation;
    MockOracle public oracle;
    MockERC20 public token;

    address public owner = address(this);
    address public author = address(0x1);
    address public reader = address(0x2);
    address public curator = address(0x3);

    uint256 constant PRICE = 0.01 ether;

    function setUp() public {
        token = new MockERC20();
        registry = new ContentRegistry();
        payment = new MicroPayment(address(registry), address(token));
        curation = new CurationAgent(address(registry), address(token));
        oracle = new MockOracle(2e18);

        registry.setPaymentContract(address(payment));
        payment.setCurationAgent(address(curation));
        payment.setOracle(address(oracle));

        vm.prank(author);
        registry.publish("cid-1", '{"title":"Test"}', PRICE, keccak256("content"));

        // Fund reader with tokens
        token.mint(reader, 100 ether);
    }

    function _approveAndDeposit(address user, uint256 amount) internal {
        vm.startPrank(user);
        token.approve(address(payment), amount);
        payment.deposit(amount);
        vm.stopPrank();
    }

    function test_Deposit() public {
        _approveAndDeposit(reader, 1 ether);
        assertEq(payment.readerBalances(reader), 1 ether);
    }

    function test_DepositZero() public {
        vm.startPrank(reader);
        token.approve(address(payment), 1 ether);
        vm.expectRevert("Zero deposit");
        payment.deposit(0);
        vm.stopPrank();
    }

    function test_PayForRead() public {
        _approveAndDeposit(reader, 1 ether);

        vm.prank(reader);
        payment.payForRead(0);

        assertEq(payment.readerBalances(reader), 1 ether - PRICE);
        assertTrue(payment.hasRead(reader, 0));
        assertEq(registry.getArticle(0).totalReads, 1);

        uint256 expectedProtocolFee = (PRICE * 250) / 10000;
        uint256 expectedCreatorAmount = PRICE - expectedProtocolFee;
        assertEq(payment.creatorEarnings(author), expectedCreatorAmount);
        assertEq(payment.protocolTreasury(), expectedProtocolFee);
    }

    function test_PayForReadWithCuratorBoost() public {
        token.mint(curator, 10 ether);
        vm.startPrank(curator);
        token.approve(address(curation), 1 ether);
        curation.boostArticle(0, 1 ether);
        vm.stopPrank();

        _approveAndDeposit(reader, 1 ether);
        vm.prank(reader);
        payment.payForRead(0);

        uint256 expectedProtocolFee = (PRICE * 250) / 10000;
        uint256 expectedCuratorFee = (PRICE * 1000) / 10000;
        uint256 expectedCreatorAmount = PRICE - expectedProtocolFee - expectedCuratorFee;

        assertEq(payment.protocolTreasury(), expectedProtocolFee);
        assertEq(payment.curatorRewardPool(0), expectedCuratorFee);
        assertEq(payment.creatorEarnings(author), expectedCreatorAmount);
    }

    function test_PayForFreeArticle() public {
        vm.prank(author);
        registry.publish("cid-free", '{"title":"Free"}', 0, keccak256("free"));

        vm.prank(reader);
        payment.payForRead(1);

        assertTrue(payment.hasRead(reader, 1));
        assertEq(registry.getArticle(1).totalReads, 1);
        assertEq(payment.creatorEarnings(author), 0);
    }

    function test_DoubleReadPrevented() public {
        _approveAndDeposit(reader, 1 ether);
        vm.prank(reader);
        payment.payForRead(0);

        vm.prank(reader);
        vm.expectRevert("Already read");
        payment.payForRead(0);
    }

    function test_InsufficientBalance() public {
        vm.prank(reader);
        vm.expectRevert("Insufficient balance");
        payment.payForRead(0);
    }

    function test_ReadInactiveArticle() public {
        vm.prank(author);
        registry.deactivate(0);
        _approveAndDeposit(reader, 1 ether);

        vm.prank(reader);
        vm.expectRevert("Article inactive");
        payment.payForRead(0);
    }

    function test_CreatorWithdraw() public {
        _approveAndDeposit(reader, 1 ether);
        vm.prank(reader);
        payment.payForRead(0);

        uint256 earnings = payment.creatorEarnings(author);
        assertTrue(earnings > 0);

        uint256 balBefore = token.balanceOf(author);
        vm.prank(author);
        payment.withdraw();
        assertEq(token.balanceOf(author) - balBefore, earnings);
        assertEq(payment.creatorEarnings(author), 0);
    }

    function test_CreatorWithdrawNothing() public {
        vm.prank(author);
        vm.expectRevert("Nothing to withdraw");
        payment.withdraw();
    }

    function test_ProtocolWithdraw() public {
        _approveAndDeposit(reader, 1 ether);
        vm.prank(reader);
        payment.payForRead(0);

        uint256 treasury = payment.protocolTreasury();
        assertTrue(treasury > 0);

        uint256 balBefore = token.balanceOf(owner);
        payment.withdrawProtocolFees();
        assertEq(token.balanceOf(owner) - balBefore, treasury);
    }

    function test_ProtocolWithdrawOnlyOwner() public {
        vm.prank(reader);
        vm.expectRevert();
        payment.withdrawProtocolFees();
    }

    function test_ReaderWithdrawBalance() public {
        _approveAndDeposit(reader, 1 ether);

        uint256 balBefore = token.balanceOf(reader);
        vm.prank(reader);
        payment.withdrawReaderBalance();
        assertEq(token.balanceOf(reader) - balBefore, 1 ether);
        assertEq(payment.readerBalances(reader), 0);
    }

    function test_ReaderWithdrawNothing() public {
        vm.prank(reader);
        vm.expectRevert("Nothing to withdraw");
        payment.withdrawReaderBalance();
    }

    function test_SetProtocolFee() public {
        payment.setProtocolFee(500);
        assertEq(payment.protocolFeeBps(), 500);
    }

    function test_SetProtocolFeeTooHigh() public {
        vm.expectRevert("Fee too high");
        payment.setProtocolFee(1001);
    }

    function test_SetProtocolFeeOnlyOwner() public {
        vm.prank(reader);
        vm.expectRevert();
        payment.setProtocolFee(500);
    }

    function test_HasAccess() public {
        assertFalse(payment.hasAccess(reader, 0));
        _approveAndDeposit(reader, 1 ether);
        vm.prank(reader);
        payment.payForRead(0);
        assertTrue(payment.hasAccess(reader, 0));
    }

    function test_GetDynamicPrice() public view {
        uint256 dynamicPrice = payment.getDynamicPrice(0);
        assertEq(dynamicPrice, 5e15);
    }

    function test_GetDynamicPriceNoOracle() public {
        MicroPayment payment2 = new MicroPayment(address(registry), address(token));
        assertEq(payment2.getDynamicPrice(0), PRICE);
    }

    function test_MultipleReads() public {
        vm.prank(author);
        registry.publish("cid-2", "{}", PRICE, keccak256("b"));
        vm.prank(author);
        registry.publish("cid-3", "{}", PRICE, keccak256("c"));

        _approveAndDeposit(reader, 1 ether);

        vm.startPrank(reader);
        payment.payForRead(0);
        payment.payForRead(1);
        payment.payForRead(2);
        vm.stopPrank();

        assertEq(payment.readerBalances(reader), 1 ether - (PRICE * 3));
        assertTrue(payment.hasAccess(reader, 0));
        assertTrue(payment.hasAccess(reader, 1));
        assertTrue(payment.hasAccess(reader, 2));
    }

    function test_ClaimCuratorRewards() public {
        // Curator boosts article 0
        token.mint(curator, 10 ether);
        vm.startPrank(curator);
        token.approve(address(curation), 1 ether);
        curation.boostArticle(0, 1 ether);
        vm.stopPrank();

        // Reader reads the boosted article
        _approveAndDeposit(reader, 1 ether);
        vm.prank(reader);
        payment.payForRead(0);

        // Verify reward pool has 10% of PRICE
        uint256 expectedCuratorFee = (PRICE * 1000) / 10000;
        assertEq(payment.curatorRewardPool(0), expectedCuratorFee);

        // Check pending rewards
        uint256 pending = payment.pendingCuratorRewards(curator, 0);
        assertEq(pending, expectedCuratorFee);

        // Curator claims rewards
        uint256 balBefore = token.balanceOf(curator);
        vm.prank(curator);
        payment.claimCuratorRewards(0);
        assertEq(token.balanceOf(curator) - balBefore, expectedCuratorFee);

        // No more pending
        assertEq(payment.pendingCuratorRewards(curator, 0), 0);
    }

    function test_ClaimCuratorRewardsNoStake() public {
        vm.prank(reader);
        vm.expectRevert("No stake");
        payment.claimCuratorRewards(0);
    }

    function test_ClaimCuratorRewardsProportional() public {
        address curator2 = address(0x5);
        token.mint(curator, 10 ether);
        token.mint(curator2, 10 ether);

        // curator stakes 3, curator2 stakes 1 (75%/25% split)
        vm.startPrank(curator);
        token.approve(address(curation), 3 ether);
        curation.boostArticle(0, 3 ether);
        vm.stopPrank();

        vm.startPrank(curator2);
        token.approve(address(curation), 1 ether);
        curation.boostArticle(0, 1 ether);
        vm.stopPrank();

        // Reader reads
        _approveAndDeposit(reader, 1 ether);
        vm.prank(reader);
        payment.payForRead(0);

        uint256 totalFee = (PRICE * 1000) / 10000;

        // curator gets 75%, curator2 gets 25%
        assertEq(payment.pendingCuratorRewards(curator, 0), (totalFee * 3) / 4);
        assertEq(payment.pendingCuratorRewards(curator2, 0), totalFee / 4);
    }
}
