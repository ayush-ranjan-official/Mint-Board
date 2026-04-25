// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ContentRegistry.sol";
import "../src/MicroPayment.sol";
import "../src/CurationAgent.sol";
import "../src/MockOracle.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Mock MIN", "MIN") {}
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract IntegrationTest is Test {
    ContentRegistry public registry;
    MicroPayment public payment;
    CurationAgent public curation;
    MockOracle public oracle;
    MockToken public token;

    address public deployer = address(this);
    address public author = address(0x1);
    address public reader1 = address(0x2);
    address public reader2 = address(0x3);
    address public curator = address(0x4);
    address public aiAgent = address(0x10);

    uint256 constant PRICE = 0.01 ether;

    function setUp() public {
        token = new MockToken();
        registry = new ContentRegistry();
        payment = new MicroPayment(address(registry), address(token));
        curation = new CurationAgent(address(registry), address(token));
        oracle = new MockOracle(2e18);

        registry.setPaymentContract(address(payment));
        payment.setCurationAgent(address(curation));
        payment.setOracle(address(oracle));
        curation.authorizeAgent(aiAgent);

        token.mint(reader1, 100 ether);
        token.mint(reader2, 100 ether);
        token.mint(curator, 100 ether);
    }

    function _approveAndDeposit(address user, uint256 amount) internal {
        vm.startPrank(user);
        token.approve(address(payment), amount);
        payment.deposit(amount);
        vm.stopPrank();
    }

    function test_FullFlowWithCurator() public {
        bytes32 contentHash = keccak256("My amazing article about DeFi");
        vm.prank(author);
        uint256 articleId = registry.publish("article-1", '{"title":"DeFi Guide"}', PRICE, contentHash);

        vm.prank(aiAgent);
        curation.submitScore(articleId, 85, "high-quality-defi-content");

        vm.startPrank(curator);
        token.approve(address(curation), 5 ether);
        curation.boostArticle(articleId, 5 ether);
        vm.stopPrank();

        _approveAndDeposit(reader1, 1 ether);
        vm.prank(reader1);
        payment.payForRead(articleId);

        uint256 expectedProtocol = (PRICE * 250) / 10000;
        uint256 expectedCurator = (PRICE * 1000) / 10000;
        uint256 expectedCreator = PRICE - expectedProtocol - expectedCurator;

        assertEq(payment.protocolTreasury(), expectedProtocol);
        assertEq(payment.curatorRewardPool(articleId), expectedCurator);
        assertEq(payment.creatorEarnings(author), expectedCreator);
        assertTrue(registry.verifyContent(articleId, contentHash));

        uint256 authorBalBefore = token.balanceOf(author);
        vm.prank(author);
        payment.withdraw();
        assertEq(token.balanceOf(author) - authorBalBefore, expectedCreator);

        assertEq(registry.getArticle(articleId).totalReads, 1);
    }

    function test_FullFlowWithoutCurator() public {
        vm.prank(author);
        uint256 articleId = registry.publish("art-1", "{}", PRICE, keccak256("c"));

        _approveAndDeposit(reader1, 1 ether);
        vm.prank(reader1);
        payment.payForRead(articleId);

        uint256 expectedProtocol = (PRICE * 250) / 10000;
        uint256 expectedCreator = PRICE - expectedProtocol;

        assertEq(payment.protocolTreasury(), expectedProtocol);
        assertEq(payment.curatorRewardPool(articleId), 0);
        assertEq(payment.creatorEarnings(author), expectedCreator);
    }

    function test_MultipleReadersOneArticle() public {
        vm.prank(author);
        uint256 articleId = registry.publish("art-1", "{}", PRICE, keccak256("c"));

        _approveAndDeposit(reader1, 1 ether);
        vm.prank(reader1);
        payment.payForRead(articleId);

        _approveAndDeposit(reader2, 1 ether);
        vm.prank(reader2);
        payment.payForRead(articleId);

        assertEq(registry.getArticle(articleId).totalReads, 2);
    }

    function test_AIAgentScoresMultipleArticles() public {
        vm.startPrank(author);
        registry.publish("art-0", "{}", PRICE, keccak256("a"));
        registry.publish("art-1", "{}", PRICE, keccak256("b"));
        registry.publish("art-2", "{}", PRICE, keccak256("c"));
        vm.stopPrank();

        vm.startPrank(aiAgent);
        curation.submitScore(0, 90, "excellent");
        curation.submitScore(1, 45, "mediocre");
        curation.submitScore(2, 75, "good");
        vm.stopPrank();

        assertEq(curation.getScore(0).score, 90);
        assertEq(curation.getScore(1).score, 45);
        assertEq(curation.getScore(2).score, 75);
    }

    function test_FeaturedArticlesMultipleBoosts() public {
        vm.startPrank(author);
        registry.publish("art-0", "{}", PRICE, keccak256("a"));
        registry.publish("art-1", "{}", PRICE, keccak256("b"));
        vm.stopPrank();

        vm.startPrank(curator);
        token.approve(address(curation), 4 ether);
        curation.boostArticle(0, 3 ether);
        curation.boostArticle(1, 1 ether);
        vm.stopPrank();

        assertEq(curation.getFeaturedArticles().length, 2);
    }

    function test_WithdrawalFlows() public {
        vm.prank(author);
        registry.publish("art-0", "{}", PRICE, keccak256("a"));

        _approveAndDeposit(reader1, 1 ether);
        vm.prank(reader1);
        payment.payForRead(0);

        uint256 remaining = payment.readerBalances(reader1);
        vm.prank(reader1);
        payment.withdrawReaderBalance();
        assertEq(token.balanceOf(reader1), 100 ether - 1 ether + remaining);

        vm.startPrank(curator);
        token.approve(address(curation), 2 ether);
        curation.boostArticle(0, 2 ether);
        curation.withdrawBoost(0);
        vm.stopPrank();
        assertEq(token.balanceOf(curator), 100 ether);
    }

    function test_ContentVerificationFlow() public {
        string memory content = "This is the actual article content.";
        bytes32 hash = keccak256(bytes(content));

        vm.prank(author);
        registry.publish("article-1", '{"title":"Verified"}', PRICE, hash);

        assertTrue(registry.verifyContent(0, keccak256(bytes(content))));
        assertFalse(registry.verifyContent(0, keccak256(bytes("tampered"))));
    }

    function test_RevokedAgentCannotScore() public {
        vm.prank(author);
        registry.publish("art-0", "{}", PRICE, keccak256("a"));

        vm.prank(aiAgent);
        curation.submitScore(0, 80, "good");

        curation.revokeAgent(aiAgent);

        vm.prank(aiAgent);
        vm.expectRevert("Not authorized agent");
        curation.submitScore(0, 90, "better");
    }
}
