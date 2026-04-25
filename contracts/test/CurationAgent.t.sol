// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CurationAgent.sol";
import "../src/ContentRegistry.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockBoostToken is ERC20 {
    constructor() ERC20("Mock MIN", "MIN") {}
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract CurationAgentTest is Test {
    CurationAgent public curation;
    ContentRegistry public registry;
    MockBoostToken public token;

    address public owner = address(this);
    address public agent = address(0x10);
    address public author = address(0x1);
    address public curator = address(0x2);
    address public unauthorized = address(0x3);

    function setUp() public {
        token = new MockBoostToken();
        registry = new ContentRegistry();
        curation = new CurationAgent(address(registry), address(token));

        vm.prank(author);
        registry.publish("cid-1", '{"title":"Test"}', 1e16, keccak256("content"));

        curation.authorizeAgent(agent);
        token.mint(curator, 100 ether);
    }

    function _approveAndBoost(address user, uint256 articleId, uint256 amount) internal {
        vm.startPrank(user);
        token.approve(address(curation), amount);
        curation.boostArticle(articleId, amount);
        vm.stopPrank();
    }

    function test_AuthorizeAgent() public view {
        assertTrue(curation.authorizedAgents(agent));
    }

    function test_AuthorizeAgentOnlyOwner() public {
        vm.prank(unauthorized);
        vm.expectRevert();
        curation.authorizeAgent(address(0x99));
    }

    function test_RevokeAgent() public {
        curation.revokeAgent(agent);
        assertFalse(curation.authorizedAgents(agent));
    }

    function test_SubmitScore() public {
        vm.prank(agent);
        curation.submitScore(0, 85, "reason-hash-123");

        CurationAgent.QualityScore memory score = curation.getScore(0);
        assertEq(score.score, 85);
        assertEq(score.scoredBy, agent);
        assertEq(score.reasonHash, "reason-hash-123");
        assertTrue(score.timestamp > 0);
    }

    function test_SubmitScoreUnauthorized() public {
        vm.prank(unauthorized);
        vm.expectRevert("Not authorized agent");
        curation.submitScore(0, 85, "reason");
    }

    function test_SubmitScoreAbove100() public {
        vm.prank(agent);
        vm.expectRevert("Score must be 0-100");
        curation.submitScore(0, 101, "reason");
    }

    function test_SubmitScoreNonexistentArticle() public {
        vm.prank(agent);
        vm.expectRevert("Article not found");
        curation.submitScore(999, 50, "reason");
    }

    function test_SubmitScoreZero() public {
        vm.prank(agent);
        curation.submitScore(0, 0, "terrible");
        assertEq(curation.getScore(0).score, 0);
    }

    function test_SubmitScoreOverwrite() public {
        vm.prank(agent);
        curation.submitScore(0, 50, "first");
        vm.prank(agent);
        curation.submitScore(0, 90, "updated");
        assertEq(curation.getScore(0).score, 90);
    }

    function test_BoostArticle() public {
        _approveAndBoost(curator, 0, 1 ether);
        assertEq(curation.totalBoosts(0), 1 ether);
        assertEq(curation.curatorStakes(curator, 0), 1 ether);
        assertEq(curation.getBoostAmount(0), 1 ether);
    }

    function test_BoostArticleZeroAmount() public {
        vm.startPrank(curator);
        token.approve(address(curation), 1 ether);
        vm.expectRevert("Zero boost");
        curation.boostArticle(0, 0);
        vm.stopPrank();
    }

    function test_BoostInactiveArticle() public {
        vm.prank(author);
        registry.deactivate(0);

        vm.startPrank(curator);
        token.approve(address(curation), 1 ether);
        vm.expectRevert("Article inactive");
        curation.boostArticle(0, 1 ether);
        vm.stopPrank();
    }

    function test_BoostAddedToFeatured() public {
        _approveAndBoost(curator, 0, 1 ether);
        uint256[] memory featured = curation.getFeaturedArticles();
        assertEq(featured.length, 1);
        assertEq(featured[0], 0);
    }

    function test_BoostNoDuplicateFeatured() public {
        _approveAndBoost(curator, 0, 1 ether);
        _approveAndBoost(curator, 0, 1 ether);
        uint256[] memory featured = curation.getFeaturedArticles();
        assertEq(featured.length, 1);
        assertEq(curation.totalBoosts(0), 2 ether);
    }

    function test_WithdrawBoost() public {
        _approveAndBoost(curator, 0, 2 ether);

        uint256 balBefore = token.balanceOf(curator);
        vm.prank(curator);
        curation.withdrawBoost(0);
        uint256 balAfter = token.balanceOf(curator);

        assertEq(balAfter - balBefore, 2 ether);
        assertEq(curation.curatorStakes(curator, 0), 0);
        assertEq(curation.totalBoosts(0), 0);
    }

    function test_WithdrawBoostNoStake() public {
        vm.prank(curator);
        vm.expectRevert("No stake");
        curation.withdrawBoost(0);
    }

    function test_MultipleCurators() public {
        address curator2 = address(0x4);
        token.mint(curator2, 100 ether);

        _approveAndBoost(curator, 0, 1 ether);
        _approveAndBoost(curator2, 0, 3 ether);

        assertEq(curation.totalBoosts(0), 4 ether);
        assertEq(curation.curatorStakes(curator, 0), 1 ether);
        assertEq(curation.curatorStakes(curator2, 0), 3 ether);
    }
}
