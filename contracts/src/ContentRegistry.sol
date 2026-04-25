// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ContentRegistry is Ownable {
    struct Article {
        uint256 id;
        address author;
        string contentCID;
        string metadataJSON;
        uint256 pricePerRead;
        uint256 publishedAt;
        uint256 totalReads;
        bool isActive;
        bytes32 contentHash;
    }

    uint256 public nextArticleId;
    mapping(uint256 => Article) public articles;
    mapping(address => uint256[]) public authorArticles;
    address public paymentContract;

    event ArticlePublished(uint256 indexed id, address indexed author, uint256 pricePerRead);
    event ArticleUpdated(uint256 indexed id);
    event ArticleDeactivated(uint256 indexed id);

    constructor() Ownable(msg.sender) {}

    /// @notice Set the MicroPayment contract address (only it can increment reads)
    function setPaymentContract(address _paymentContract) external onlyOwner {
        require(_paymentContract != address(0), "Zero address");
        paymentContract = _paymentContract;
    }

    /// @notice Publish a new article with content hash for verification
    function publish(
        string calldata contentCID,
        string calldata metadataJSON,
        uint256 pricePerRead,
        bytes32 contentHash
    ) external returns (uint256) {
        require(pricePerRead <= 1e18, "Price too high");
        uint256 id = nextArticleId++;
        articles[id] = Article({
            id: id,
            author: msg.sender,
            contentCID: contentCID,
            metadataJSON: metadataJSON,
            pricePerRead: pricePerRead,
            publishedAt: block.timestamp,
            totalReads: 0,
            isActive: true,
            contentHash: contentHash
        });
        authorArticles[msg.sender].push(id);
        emit ArticlePublished(id, msg.sender, pricePerRead);
        return id;
    }

    /// @notice Update article metadata (author only)
    function updateMetadata(uint256 id, string calldata metadataJSON) external {
        require(articles[id].author == msg.sender, "Not author");
        articles[id].metadataJSON = metadataJSON;
        emit ArticleUpdated(id);
    }

    /// @notice Deactivate an article (author only)
    function deactivate(uint256 id) external {
        require(articles[id].author == msg.sender, "Not author");
        articles[id].isActive = false;
        emit ArticleDeactivated(id);
    }

    /// @notice Increment read count (called by MicroPayment contract only)
    function incrementReads(uint256 id) external {
        require(msg.sender == paymentContract, "Only payment contract");
        articles[id].totalReads++;
    }

    /// @notice Verify content integrity by comparing hashes
    function verifyContent(uint256 id, bytes32 hash) external view returns (bool) {
        return articles[id].contentHash == hash;
    }

    /// @notice Get full article data
    function getArticle(uint256 id) external view returns (Article memory) {
        return articles[id];
    }

    /// @notice Get all article IDs by author
    function getAuthorArticles(address author) external view returns (uint256[] memory) {
        return authorArticles[author];
    }

    /// @notice Get latest articles with pagination
    function getLatestArticles(uint256 count, uint256 offset) external view returns (Article[] memory) {
        uint256 total = nextArticleId;
        if (offset >= total) return new Article[](0);
        uint256 end = total - offset;
        uint256 start = end > count ? end - count : 0;
        uint256 resultCount = end - start;
        Article[] memory result = new Article[](resultCount);
        for (uint256 i = 0; i < resultCount; i++) {
            result[i] = articles[start + i];
        }
        return result;
    }
}
