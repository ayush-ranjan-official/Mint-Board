// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ContentRegistry.sol";

contract ContentRegistryTest is Test {
    ContentRegistry public registry;
    address public owner = address(this);
    address public author = address(0x1);
    address public author2 = address(0x2);
    address public paymentContract = address(0x3);

    function setUp() public {
        registry = new ContentRegistry();
        registry.setPaymentContract(paymentContract);
    }

    function test_Publish() public {
        vm.prank(author);
        uint256 id = registry.publish("cid-1", '{"title":"Test"}', 1e16, keccak256("content"));

        assertEq(id, 0);
        ContentRegistry.Article memory article = registry.getArticle(0);
        assertEq(article.author, author);
        assertEq(article.pricePerRead, 1e16);
        assertTrue(article.isActive);
        assertEq(article.contentHash, keccak256("content"));
        assertEq(article.totalReads, 0);
    }

    function test_PublishFreeArticle() public {
        vm.prank(author);
        uint256 id = registry.publish("cid-free", '{"title":"Free"}', 0, keccak256("free"));
        ContentRegistry.Article memory article = registry.getArticle(id);
        assertEq(article.pricePerRead, 0);
    }

    function test_PublishPriceTooHigh() public {
        vm.prank(author);
        vm.expectRevert("Price too high");
        registry.publish("cid-1", '{"title":"Test"}', 2e18, keccak256("content"));
    }

    function test_VerifyContent() public {
        bytes32 hash = keccak256("my article content");
        vm.prank(author);
        registry.publish("cid-1", '{"title":"Test"}', 1e16, hash);

        assertTrue(registry.verifyContent(0, hash));
        assertFalse(registry.verifyContent(0, keccak256("tampered content")));
    }

    function test_UpdateMetadata() public {
        vm.prank(author);
        registry.publish("cid-1", '{"title":"Original"}', 1e16, keccak256("c"));

        vm.prank(author);
        registry.updateMetadata(0, '{"title":"Updated"}');

        ContentRegistry.Article memory article = registry.getArticle(0);
        assertEq(article.metadataJSON, '{"title":"Updated"}');
    }

    function test_UpdateMetadataNotAuthor() public {
        vm.prank(author);
        registry.publish("cid-1", '{"title":"Test"}', 1e16, keccak256("c"));

        vm.prank(author2);
        vm.expectRevert("Not author");
        registry.updateMetadata(0, '{"title":"Hack"}');
    }

    function test_Deactivate() public {
        vm.prank(author);
        registry.publish("cid-1", '{"title":"Test"}', 1e16, keccak256("c"));

        vm.prank(author);
        registry.deactivate(0);

        ContentRegistry.Article memory article = registry.getArticle(0);
        assertFalse(article.isActive);
    }

    function test_DeactivateNotAuthor() public {
        vm.prank(author);
        registry.publish("cid-1", '{"title":"Test"}', 1e16, keccak256("c"));

        vm.prank(author2);
        vm.expectRevert("Not author");
        registry.deactivate(0);
    }

    function test_IncrementReadsOnlyPaymentContract() public {
        vm.prank(author);
        registry.publish("cid-1", '{"title":"Test"}', 1e16, keccak256("c"));

        // Should fail from non-payment address
        vm.prank(author);
        vm.expectRevert("Only payment contract");
        registry.incrementReads(0);

        // Should succeed from payment contract
        vm.prank(paymentContract);
        registry.incrementReads(0);
        assertEq(registry.getArticle(0).totalReads, 1);
    }

    function test_SetPaymentContractOnlyOwner() public {
        vm.prank(author);
        vm.expectRevert();
        registry.setPaymentContract(address(0x99));
    }

    function test_SetPaymentContractZeroAddress() public {
        vm.expectRevert("Zero address");
        registry.setPaymentContract(address(0));
    }

    function test_GetAuthorArticles() public {
        vm.startPrank(author);
        registry.publish("cid-1", "{}", 1e16, keccak256("a"));
        registry.publish("cid-2", "{}", 1e16, keccak256("b"));
        vm.stopPrank();

        uint256[] memory ids = registry.getAuthorArticles(author);
        assertEq(ids.length, 2);
        assertEq(ids[0], 0);
        assertEq(ids[1], 1);
    }

    function test_GetLatestArticles() public {
        vm.startPrank(author);
        for (uint256 i = 0; i < 5; i++) {
            registry.publish("cid", "{}", 1e16, keccak256(abi.encodePacked(i)));
        }
        vm.stopPrank();

        ContentRegistry.Article[] memory latest = registry.getLatestArticles(3, 0);
        assertEq(latest.length, 3);
        assertEq(latest[0].id, 2);
        assertEq(latest[1].id, 3);
        assertEq(latest[2].id, 4);
    }

    function test_GetLatestArticlesWithOffset() public {
        vm.startPrank(author);
        for (uint256 i = 0; i < 5; i++) {
            registry.publish("cid", "{}", 1e16, keccak256(abi.encodePacked(i)));
        }
        vm.stopPrank();

        ContentRegistry.Article[] memory latest = registry.getLatestArticles(2, 2);
        assertEq(latest.length, 2);
        assertEq(latest[0].id, 1);
        assertEq(latest[1].id, 2);
    }

    function test_GetLatestArticlesOffsetBeyondTotal() public {
        vm.prank(author);
        registry.publish("cid", "{}", 1e16, keccak256("a"));

        ContentRegistry.Article[] memory latest = registry.getLatestArticles(10, 5);
        assertEq(latest.length, 0);
    }

    function test_MultipleAuthors() public {
        vm.prank(author);
        registry.publish("cid-1", "{}", 1e16, keccak256("a"));

        vm.prank(author2);
        registry.publish("cid-2", "{}", 2e16, keccak256("b"));

        assertEq(registry.getAuthorArticles(author).length, 1);
        assertEq(registry.getAuthorArticles(author2).length, 1);
        assertEq(registry.getArticle(1).author, author2);
    }
}
