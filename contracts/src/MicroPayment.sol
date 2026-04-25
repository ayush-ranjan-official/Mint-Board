// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IContentRegistry {
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
    function incrementReads(uint256 id) external;
}

interface ICurationAgent {
    function getBoostAmount(uint256 articleId) external view returns (uint256);
    function curatorStakes(address curator, uint256 articleId) external view returns (uint256);
    function totalBoosts(uint256 articleId) external view returns (uint256);
}

interface IMockOracle {
    function getPrice(string calldata pair) external view returns (uint256 price, uint256 timestamp);
}

contract MicroPayment is ReentrancyGuard, Ownable {
    IContentRegistry public contentRegistry;
    ICurationAgent public curationAgent;
    IMockOracle public oracle;
    IERC20 public paymentToken; // umin ERC20 wrapper

    uint256 public protocolFeeBps = 250; // 2.5% = 250 basis points
    uint256 public curatorFeeBps = 1000; // 10% = 1000 basis points
    uint256 public constant MAX_FEE_BPS = 1000; // 10% max for protocol fee

    // Reader balances (prepaid reading wallet model)
    mapping(address => uint256) public readerBalances;

    // Creator earnings (accumulated, withdrawable)
    mapping(address => uint256) public creatorEarnings;

    // Protocol treasury
    uint256 public protocolTreasury;

    // Curator reward pool per article
    mapping(uint256 => uint256) public curatorRewardPool;

    // Track reads to prevent double-charging
    mapping(address => mapping(uint256 => bool)) public hasRead;

    // Track curator reward claims: curator => articleId => amount already claimed
    mapping(address => mapping(uint256 => uint256)) public curatorClaimed;

    event Deposited(address indexed reader, uint256 amount);
    event PaidForRead(address indexed reader, uint256 indexed articleId, uint256 amount);
    event CreatorWithdrew(address indexed creator, uint256 amount);
    event ProtocolWithdrew(address indexed owner, uint256 amount);
    event CuratorRewardClaimed(address indexed curator, uint256 indexed articleId, uint256 amount);

    constructor(address _contentRegistry, address _paymentToken) Ownable(msg.sender) {
        contentRegistry = IContentRegistry(_contentRegistry);
        paymentToken = IERC20(_paymentToken);
    }

    /// @notice Set the CurationAgent contract address
    function setCurationAgent(address _curationAgent) external onlyOwner {
        curationAgent = ICurationAgent(_curationAgent);
    }

    /// @notice Set the oracle contract address
    function setOracle(address _oracle) external onlyOwner {
        oracle = IMockOracle(_oracle);
    }

    /// @notice Readers deposit ERC20 tokens into their reading wallet
    /// @dev User must approve this contract first via paymentToken.approve()
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Zero deposit");
        require(paymentToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        readerBalances[msg.sender] += amount;
        emit Deposited(msg.sender, amount);
    }

    /// @notice Pay for reading an article — multi-party revenue split
    function payForRead(uint256 articleId) external nonReentrant {
        require(!hasRead[msg.sender][articleId], "Already read");

        IContentRegistry.Article memory article = contentRegistry.getArticle(articleId);
        require(article.isActive, "Article inactive");
        require(article.author != address(0), "Article not found");

        uint256 price = article.pricePerRead;

        // Free articles: mark as read without payment
        if (price == 0) {
            hasRead[msg.sender][articleId] = true;
            contentRegistry.incrementReads(articleId);
            emit PaidForRead(msg.sender, articleId, 0);
            return;
        }

        require(readerBalances[msg.sender] >= price, "Insufficient balance");

        // Deduct from reader
        readerBalances[msg.sender] -= price;

        // Calculate fee split
        uint256 protocolFee = (price * protocolFeeBps) / 10000;
        uint256 curatorFee = 0;

        // If article has curator boosts, curators earn 10% of read price
        if (address(curationAgent) != address(0) && curationAgent.getBoostAmount(articleId) > 0) {
            curatorFee = (price * curatorFeeBps) / 10000;
            curatorRewardPool[articleId] += curatorFee;
        }

        uint256 creatorAmount = price - protocolFee - curatorFee;

        // Credit creator and protocol
        creatorEarnings[article.author] += creatorAmount;
        protocolTreasury += protocolFee;

        // Mark as read
        hasRead[msg.sender][articleId] = true;

        // Increment read counter
        contentRegistry.incrementReads(articleId);

        emit PaidForRead(msg.sender, articleId, price);
    }

    /// @notice Creators withdraw their accumulated earnings
    function withdraw() external nonReentrant {
        uint256 amount = creatorEarnings[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        creatorEarnings[msg.sender] = 0;
        require(paymentToken.transfer(msg.sender, amount), "Transfer failed");
        emit CreatorWithdrew(msg.sender, amount);
    }

    /// @notice Owner withdraws protocol fees
    function withdrawProtocolFees() external onlyOwner nonReentrant {
        uint256 amount = protocolTreasury;
        require(amount > 0, "Nothing to withdraw");
        protocolTreasury = 0;
        require(paymentToken.transfer(owner(), amount), "Transfer failed");
        emit ProtocolWithdrew(owner(), amount);
    }

    /// @notice Reader withdraws remaining balance
    function withdrawReaderBalance() external nonReentrant {
        uint256 amount = readerBalances[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        readerBalances[msg.sender] = 0;
        require(paymentToken.transfer(msg.sender, amount), "Transfer failed");
    }

    /// @notice Update protocol fee (owner only, max 10%)
    function setProtocolFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FEE_BPS, "Fee too high");
        protocolFeeBps = newFeeBps;
    }

    /// @notice Check if reader has access to article
    function hasAccess(address reader, uint256 articleId) external view returns (bool) {
        return hasRead[reader][articleId];
    }

    /// @notice Curators claim their proportional share of the reward pool for an article
    function claimCuratorRewards(uint256 articleId) external nonReentrant {
        require(address(curationAgent) != address(0), "No curation agent");
        uint256 myStake = curationAgent.curatorStakes(msg.sender, articleId);
        require(myStake > 0, "No stake");

        uint256 totalStake = curationAgent.totalBoosts(articleId);
        uint256 totalPool = curatorRewardPool[articleId];
        require(totalPool > 0, "No rewards");

        // Calculate proportional share: (myStake / totalStake) * totalPool
        uint256 totalEntitlement = (totalPool * myStake) / totalStake;
        uint256 alreadyClaimed = curatorClaimed[msg.sender][articleId];
        uint256 claimable = totalEntitlement - alreadyClaimed;
        require(claimable > 0, "Nothing to claim");

        curatorClaimed[msg.sender][articleId] += claimable;
        require(paymentToken.transfer(msg.sender, claimable), "Transfer failed");
        emit CuratorRewardClaimed(msg.sender, articleId, claimable);
    }

    /// @notice View pending curator rewards for a specific curator and article
    function pendingCuratorRewards(address curator, uint256 articleId) external view returns (uint256) {
        if (address(curationAgent) == address(0)) return 0;
        uint256 myStake = curationAgent.curatorStakes(curator, articleId);
        if (myStake == 0) return 0;
        uint256 totalStake = curationAgent.totalBoosts(articleId);
        if (totalStake == 0) return 0;
        uint256 totalPool = curatorRewardPool[articleId];
        uint256 totalEntitlement = (totalPool * myStake) / totalStake;
        uint256 alreadyClaimed = curatorClaimed[curator][articleId];
        if (totalEntitlement <= alreadyClaimed) return 0;
        return totalEntitlement - alreadyClaimed;
    }

    /// @notice Get dynamic price based on oracle (USD-equivalent pricing)
    function getDynamicPrice(uint256 articleId) external view returns (uint256) {
        IContentRegistry.Article memory article = contentRegistry.getArticle(articleId);
        if (address(oracle) == address(0)) {
            return article.pricePerRead;
        }
        (uint256 tokenPriceUSD,) = oracle.getPrice("INIT/USD");
        if (tokenPriceUSD == 0) {
            return article.pricePerRead;
        }
        return (article.pricePerRead * 1e18) / tokenPriceUSD;
    }
}
