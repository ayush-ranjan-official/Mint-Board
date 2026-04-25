"""
Autonomous AI Curator Agent

This background service:
1. Polls ContentRegistry for new articles
2. Analyzes content quality via ATXP LLM Gateway
3. Submits quality scores on-chain to CurationAgent.sol using its own wallet

The agent has its own wallet and uses direct transactions (simulated auto-signing
for the AI agent on testnet).
"""
import os
import json
import asyncio
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("curator_agent")

APPCHAIN_RPC = os.getenv("APPCHAIN_RPC", "http://localhost:8545")
CONTENT_REGISTRY_ADDRESS = os.getenv("CONTENT_REGISTRY_ADDRESS", "")
CURATION_AGENT_ADDRESS = os.getenv("CURATION_AGENT_ADDRESS", "")
AGENT_PRIVATE_KEY = os.getenv("AGENT_PRIVATE_KEY", "")

# ABI fragments for the contracts we interact with
CONTENT_REGISTRY_ABI = json.loads("""[
    {
        "inputs": [],
        "name": "nextArticleId",
        "outputs": [{"type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "id", "type": "uint256"}],
        "name": "getArticle",
        "outputs": [{
            "components": [
                {"name": "id", "type": "uint256"},
                {"name": "author", "type": "address"},
                {"name": "contentCID", "type": "string"},
                {"name": "metadataJSON", "type": "string"},
                {"name": "pricePerRead", "type": "uint256"},
                {"name": "publishedAt", "type": "uint256"},
                {"name": "totalReads", "type": "uint256"},
                {"name": "isActive", "type": "bool"},
                {"name": "contentHash", "type": "bytes32"}
            ],
            "type": "tuple"
        }],
        "stateMutability": "view",
        "type": "function"
    }
]""")

CURATION_AGENT_ABI = json.loads("""[
    {
        "inputs": [
            {"name": "articleId", "type": "uint256"},
            {"name": "score", "type": "uint256"},
            {"name": "reasonHash", "type": "string"}
        ],
        "name": "submitScore",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "articleId", "type": "uint256"}],
        "name": "getScore",
        "outputs": [{
            "components": [
                {"name": "score", "type": "uint256"},
                {"name": "timestamp", "type": "uint256"},
                {"name": "scoredBy", "type": "address"},
                {"name": "reasonHash", "type": "string"}
            ],
            "type": "tuple"
        }],
        "stateMutability": "view",
        "type": "function"
    }
]""")


class CuratorAgent:
    def __init__(self):
        self.last_scored_id = -1
        self.w3 = None
        self.registry = None
        self.curation = None
        self.account = None

    def _init_web3(self):
        """Initialize Web3 connection and contracts."""
        if not all([CONTENT_REGISTRY_ADDRESS, CURATION_AGENT_ADDRESS, AGENT_PRIVATE_KEY]):
            logger.warning("Curator agent not configured: missing contract addresses or private key")
            return False

        try:
            from web3 import Web3
            self.w3 = Web3(Web3.HTTPProvider(APPCHAIN_RPC))
            if not self.w3.is_connected():
                logger.warning(f"Cannot connect to appchain at {APPCHAIN_RPC}")
                return False

            self.registry = self.w3.eth.contract(
                address=Web3.to_checksum_address(CONTENT_REGISTRY_ADDRESS),
                abi=CONTENT_REGISTRY_ABI,
            )
            self.curation = self.w3.eth.contract(
                address=Web3.to_checksum_address(CURATION_AGENT_ADDRESS),
                abi=CURATION_AGENT_ABI,
            )
            self.account = self.w3.eth.account.from_key(AGENT_PRIVATE_KEY)
            logger.info(f"Curator agent initialized. Address: {self.account.address}")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize Web3: {e}")
            return False

    async def poll_and_score(self):
        """Main polling loop: check for new articles and score them."""
        if not self._init_web3():
            logger.info("Curator agent disabled (not configured)")
            return

        logger.info("Curator agent started polling for new articles...")

        while True:
            try:
                next_id = self.registry.functions.nextArticleId().call()

                for article_id in range(self.last_scored_id + 1, next_id):
                    await self._score_article(article_id)
                    self.last_scored_id = article_id

            except Exception as e:
                logger.error(f"Polling error: {e}")

            await asyncio.sleep(15)  # Poll every 15 seconds

    async def _score_article(self, article_id: int):
        """Analyze and score a single article."""
        try:
            # Get article from contract
            article = self.registry.functions.getArticle(article_id).call()
            if article[1] == "0x0000000000000000000000000000000000000000":
                return

            # Check if already scored
            existing = self.curation.functions.getScore(article_id).call()
            if existing[1] > 0:  # timestamp > 0 means already scored
                logger.info(f"Article {article_id} already scored, skipping")
                self.last_scored_id = article_id
                return

            content_cid = article[2]  # contentCID

            # Fetch content from local article store
            from services.article_store import get_article
            stored = await get_article(article_id)

            if stored is None:
                logger.warning(f"Article {article_id} content not found in store")
                return

            # Analyze content via ATXP
            from services.content_analyzer import analyze_content
            analysis = analyze_content(stored["title"], stored["content"])
            quality = analysis.get("qualityScore", 5.0)

            # Convert 1-10 scale to 0-100
            score = min(100, max(0, int(quality * 10)))

            reason_hash = f"ai-analysis-{article_id}"

            # Submit score on-chain
            tx = self.curation.functions.submitScore(
                article_id, score, reason_hash
            ).build_transaction({
                "from": self.account.address,
                "nonce": self.w3.eth.get_transaction_count(self.account.address),
                "gas": 500000,
                "gasPrice": self.w3.eth.gas_price or 0,
            })

            signed = self.w3.eth.account.sign_transaction(tx, AGENT_PRIVATE_KEY)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)

            if receipt.status == 1:
                logger.info(f"Scored article {article_id}: {score}/100 (tx: {tx_hash.hex()})")
            else:
                logger.error(f"Score tx failed for article {article_id}")

        except Exception as e:
            logger.error(f"Error scoring article {article_id}: {e}")


# Singleton instance
curator_agent = CuratorAgent()


async def start_curator_agent():
    """Start the curator agent background task."""
    await curator_agent.poll_and_score()
