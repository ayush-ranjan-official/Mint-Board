// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IContentRegistryReader {
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
    function getArticle(uint256 id) external view returns (Article memory);
}

contract CurationAgent is Ownable {
    IContentRegistryReader public contentRegistry;
    IERC20 public boostToken; // umin ERC20 wrapper

    // Authorized AI agent addresses (can submit scores)
    mapping(address => bool) public authorizedAgents;

    struct QualityScore {
        uint256 score;          // 0-100 (AI quality assessment)
        uint256 timestamp;
        address scoredBy;       // Which agent scored it
        string reasonHash;      // Hash of AI reasoning (stored off-chain)
    }

    // Article ID => QualityScore
    mapping(uint256 => QualityScore) public scores;

    // Curator boosts: curator => articleId => staked amount
    mapping(address => mapping(uint256 => uint256)) public curatorStakes;

    // Total boost per article
    mapping(uint256 => uint256) public totalBoosts;

    // Featured article IDs
    uint256[] public featuredArticles;

    event AgentAuthorized(address indexed agent);
    event AgentRevoked(address indexed agent);
    event AgentScored(uint256 indexed articleId, uint256 score, address indexed agent);
    event ArticleBoosted(uint256 indexed articleId, address indexed curator, uint256 amount);
    event BoostWithdrawn(uint256 indexed articleId, address indexed curator, uint256 amount);

    constructor(address _contentRegistry, address _boostToken) Ownable(msg.sender) {
        contentRegistry = IContentRegistryReader(_contentRegistry);
        boostToken = IERC20(_boostToken);
    }

    /// @notice Owner authorizes an AI agent wallet to submit scores
    function authorizeAgent(address agent) external onlyOwner {
        authorizedAgents[agent] = true;
        emit AgentAuthorized(agent);
    }

    /// @notice Owner revokes an AI agent's authorization
    function revokeAgent(address agent) external onlyOwner {
        authorizedAgents[agent] = false;
        emit AgentRevoked(agent);
    }

    /// @notice AI agent submits a quality score for an article
    function submitScore(
        uint256 articleId,
        uint256 score,
        string calldata reasonHash
    ) external {
        require(authorizedAgents[msg.sender], "Not authorized agent");
        require(score <= 100, "Score must be 0-100");

        IContentRegistryReader.Article memory article = contentRegistry.getArticle(articleId);
        require(article.author != address(0), "Article not found");

        scores[articleId] = QualityScore({
            score: score,
            timestamp: block.timestamp,
            scoredBy: msg.sender,
            reasonHash: reasonHash
        });

        emit AgentScored(articleId, score, msg.sender);
    }

    /// @notice Readers boost articles by staking ERC20 tokens
    /// @dev User must approve this contract first via boostToken.approve()
    function boostArticle(uint256 articleId, uint256 amount) external {
        require(amount > 0, "Zero boost");
        IContentRegistryReader.Article memory article = contentRegistry.getArticle(articleId);
        require(article.isActive, "Article inactive");

        require(boostToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        curatorStakes[msg.sender][articleId] += amount;
        totalBoosts[articleId] += amount;

        // Add to featured if not already present
        bool found = false;
        for (uint256 i = 0; i < featuredArticles.length; i++) {
            if (featuredArticles[i] == articleId) {
                found = true;
                break;
            }
        }
        if (!found) featuredArticles.push(articleId);

        emit ArticleBoosted(articleId, msg.sender, amount);
    }

    /// @notice Curators withdraw their boost stake
    function withdrawBoost(uint256 articleId) external {
        uint256 amount = curatorStakes[msg.sender][articleId];
        require(amount > 0, "No stake");
        curatorStakes[msg.sender][articleId] = 0;
        totalBoosts[articleId] -= amount;
        require(boostToken.transfer(msg.sender, amount), "Transfer failed");
        emit BoostWithdrawn(articleId, msg.sender, amount);
    }

    /// @notice Get quality score for an article
    function getScore(uint256 articleId) external view returns (QualityScore memory) {
        return scores[articleId];
    }

    /// @notice Get all featured article IDs
    function getFeaturedArticles() external view returns (uint256[] memory) {
        return featuredArticles;
    }

    /// @notice Check total boost for an article
    function getBoostAmount(uint256 articleId) external view returns (uint256) {
        return totalBoosts[articleId];
    }
}
