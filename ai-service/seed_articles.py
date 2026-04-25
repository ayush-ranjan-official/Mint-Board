"""
Pre-populate demo articles for the MintBoard demo video.
All metadata is pre-generated to avoid ATXP API calls during setup.
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from services.article_store import init_db, create_article

DEMO_ARTICLES = [
    {
        "id": 0,
        "title": "Getting Started with Initia Appchains",
        "content": """# Getting Started with Initia Appchains

Initia is a network of interwoven rollups that brings modularity to the Cosmos ecosystem. If you're a developer looking to build your own appchain, this guide will walk you through everything you need to know.

## What is an Initia Appchain?

An Initia appchain (also called a minitia or rollup) is a sovereign application-specific blockchain that settles on the Initia L1. Think of it as getting your own blockchain, customized for your specific use case, while still being connected to the broader Initia ecosystem.

The key innovation is that these appchains can use different virtual machines — EVM, MoveVM, or WasmVM — depending on your needs. If you're coming from Ethereum, you can deploy Solidity contracts. If you prefer Move, that's available too.

## Setting Up Your Environment

First, you'll need the Initia toolchain:

1. **Install Go** (required for building the node binary)
2. **Install Weave** — the CLI tool for managing rollups
3. **Build minitiad** — the node binary specific to your chosen VM

For EVM appchains, the setup looks like this:

```bash
weave init
# Select: Launch a new rollup
# Select: Testnet
# Select: EVM
```

## Why Appchains Matter

Traditional L1 blockchains force all applications to share the same execution environment. This creates congestion, high fees, and limits what you can build. With appchains, you get:

- **Dedicated blockspace** — no competing with other apps for transactions
- **Custom gas tokens** — use your own native token for gas fees
- **Oracle support** — built-in price feeds via Initia's oracle module
- **Interoperability** — bridge assets seamlessly between your appchain and Initia L1

## The Interwoven Stack

What makes Initia special is the Interwoven Stack — a set of native features that come with every appchain:

- **Auto-signing** for seamless UX (users approve once, transact freely)
- **Interwoven Bridge** for moving assets between L1 and your appchain
- **Initia Usernames** (.init) for human-readable identity

These aren't bolt-on features. They're built into the protocol layer, which means they work consistently across all Initia appchains.

## Next Steps

Once your appchain is running, you can deploy smart contracts, build a frontend with InterwovenKit, and start building your application. The possibilities range from DeFi protocols to gaming to content platforms — whatever your vision, Initia's modular architecture can support it.

Happy building!""",
        "summary": "A comprehensive introduction to building on Initia's modular blockchain network, covering appchain setup, the Interwoven Stack, and why application-specific blockchains matter for developers.",
        "reading_time": 4,
        "quality_score": 8.5,
        "tags": ["Blockchain", "Initia", "Tutorial", "Developer"],
        "seo_description": "Learn how to build your own Initia appchain with this step-by-step developer guide covering setup, VM selection, and the Interwoven Stack.",
    },
    {
        "id": 1,
        "title": "The Future of Decentralized Content Monetization",
        "content": """# The Future of Decentralized Content Monetization

The creator economy is broken. Medium takes 50% through its Partner Program. Substack takes 10% on paid subscriptions. YouTube takes 45% of ad revenue. Even "creator-friendly" platforms extract significant value from the people who actually produce the content.

## The Problem with Platforms

Every major content platform follows the same playbook:

1. Attract creators with a promise of reach and revenue
2. Build a massive audience on the backs of that content
3. Gradually increase the platform's cut while making it harder for creators to leave

This isn't a bug — it's the business model. Platforms are incentivized to maximize their own revenue, not the creator's. And because they control the distribution, creators have limited alternatives.

## Micropayments as the Solution

What if readers could pay creators directly, with no intermediary taking a cut? This is the promise of blockchain-based micropayments.

The key insight is that most readers don't want a subscription. They want to read one article. Maybe two. Traditional payment systems can't handle transactions this small efficiently — a $0.05 payment would cost more in credit card fees than the payment itself.

But on a blockchain, especially an application-specific chain with near-zero gas costs, micropayments become viable. A reader can pay $0.05 to read an article, and the creator receives $0.04875 (after a tiny 2.5% protocol fee). No platform taking 50%. No subscription required.

## The UX Challenge

Blockchain payments have historically been painful. Every transaction requires a wallet popup, a gas fee estimation, and a confirmation. Reading an article shouldn't feel like filing a tax return.

The solution is auto-signing — a session-based approval system where readers authorize a spending limit once, then every subsequent payment happens invisibly. The blockchain becomes infrastructure, not interface. The reading experience feels exactly like Medium or Substack, but the economic model is fundamentally different.

## Quality Without Gatekeepers

Without platform curation, how do readers find quality content? This is where AI comes in. An autonomous AI agent can analyze every published article, generate quality scores, and surface the best content — all transparently. The scores are submitted on-chain, so the curation process is auditable and tamper-proof.

Combined with community curation (readers staking tokens to boost articles they believe in), you get a quality discovery mechanism that doesn't depend on any single company's algorithm.

## The Vision

Imagine a world where:
- Creators keep 97.5% of every dollar spent on their content
- Readers pay only for what they read, not a blanket subscription
- Quality is determined by AI analysis and community consensus, not platform algorithms
- The entire economic system runs on a transparent, auditable blockchain

This isn't science fiction. The technology exists today. The question is whether creators and readers are ready to embrace it.

*The revolution will be decentralized.*""",
        "summary": "An analysis of how blockchain micropayments and AI curation can fix the creator economy, where platforms currently take 10-50% of creator revenue. Explores auto-signing UX, on-chain quality scores, and the vision for creator-first monetization.",
        "reading_time": 5,
        "quality_score": 9.0,
        "tags": ["Creator Economy", "Micropayments", "DeFi", "Opinion"],
        "seo_description": "How blockchain micropayments and AI curation can transform content monetization, letting creators keep 97.5% while readers pay only for what they read.",
    },
    {
        "id": 2,
        "title": "Understanding DeFi Micropayments: A Technical Deep Dive",
        "content": """# Understanding DeFi Micropayments: A Technical Deep Dive

Micropayments — transactions of less than $1 — have been called "the future of the internet" for over two decades. Yet they've never achieved mainstream adoption. Until now.

## Why Micropayments Failed Before

The economics of traditional payment rails make micropayments impossible:

- **Credit card fees**: 2.9% + $0.30 per transaction (Stripe). A $0.10 payment would cost $0.33 in fees.
- **Bank transfers**: Minimum $0.25 per ACH transaction
- **PayPal**: 3.49% + $0.49 fixed fee

These fee structures are designed for $10+ transactions. Anything smaller is economically irrational.

## The Blockchain Solution

Application-specific blockchains (appchains) change the equation:

- **Gas fees**: Near-zero on dedicated appchains (fractions of a cent)
- **Settlement**: Instant (sub-second block times)
- **No intermediaries**: Smart contracts handle the payment logic directly

A $0.05 payment on an Initia appchain costs approximately $0.0001 in gas — making the economics viable for the first time.

## The Prepaid Wallet Model

Rather than making a blockchain transaction for every article read, the optimal UX uses a prepaid wallet:

1. Reader deposits a lump sum (e.g., $10 worth of tokens) into a smart contract
2. Each article read deducts the price from this on-chain balance
3. The deduction happens via an auto-signed transaction — no wallet popup

This is the same model as a transit card (Oyster, Suica) or gaming credits. The reader thinks in terms of their total balance, not individual micro-deductions.

```solidity
// Simplified payment flow
function payForRead(uint256 articleId) external {
    Article memory article = registry.getArticle(articleId);
    require(readerBalances[msg.sender] >= article.pricePerRead);

    readerBalances[msg.sender] -= article.pricePerRead;
    creatorEarnings[article.author] += article.pricePerRead;
    hasRead[msg.sender][articleId] = true;
}
```

## Revenue Sharing Architecture

The most interesting technical challenge is multi-party revenue sharing. When a reader pays $0.10 for an article:

| Recipient | Share | Amount |
|-----------|-------|--------|
| Creator | 87.5% | $0.0875 |
| Curator Pool | 10% | $0.01 |
| Protocol | 2.5% | $0.0025 |

The curator pool is distributed proportionally to readers who staked tokens to boost the article. This creates an incentive for quality curation — good curators earn returns on their stakes.

## Oracle-Based Dynamic Pricing

To maintain stable USD-equivalent pricing despite token price volatility, the system can use an oracle feed:

```
price_in_tokens = article_usd_price * 10^18 / oracle_token_price_usd
```

This means creators can set prices in familiar USD terms ($0.05, $0.10) while the actual payment amount adjusts with the token's market price.

## Security Considerations

Micropayment contracts must handle:

1. **Reentrancy**: Use `ReentrancyGuard` on all withdrawal functions
2. **Double-read prevention**: Map of `reader => articleId => bool` prevents duplicate charges
3. **Integer overflow**: Solidity 0.8+ has built-in overflow checks
4. **Access control**: Only the payment contract can increment read counts

## Conclusion

The technical infrastructure for viable micropayments now exists. The remaining challenge is adoption — convincing creators and readers to try a new model. But the economic incentives are compelling: creators keep 20-50x more revenue, and readers pay only for what they consume.""",
        "summary": "A technical exploration of how blockchain appchains make micropayments economically viable for the first time, covering prepaid wallet architecture, multi-party revenue sharing, oracle pricing, and smart contract security patterns.",
        "reading_time": 6,
        "quality_score": 8.8,
        "tags": ["DeFi", "Technical", "Smart Contracts", "Micropayments"],
        "seo_description": "Deep dive into blockchain micropayment architecture: prepaid wallets, revenue sharing, oracle pricing, and security patterns for content monetization.",
    },
    {
        "id": 3,
        "title": "Building AI-Powered Web3 Applications",
        "content": """# Building AI-Powered Web3 Applications

The intersection of AI and blockchain is one of the most exciting frontiers in technology. While many projects treat AI as a buzzword, there are genuine architectural patterns where the two technologies complement each other beautifully.

## The AI Agent Pattern

The most compelling Web3 + AI pattern is the autonomous agent. Instead of AI being a passive API that humans query, the AI becomes an active participant in the blockchain ecosystem with its own wallet and the ability to submit transactions.

Consider a content curation agent:

1. It monitors the blockchain for new content publications (events)
2. It fetches and analyzes the content using an LLM
3. It submits a quality score on-chain as a transaction
4. The score influences content discovery and revenue distribution

This agent isn't controlled by any single entity. Its analysis is transparent (scores are on-chain), its reasoning can be audited (hashes stored on-chain, full reasoning stored off-chain), and it operates autonomously.

## Architecture: Off-Chain AI + On-Chain State

The key insight is separation of concerns:

- **Off-chain**: AI inference (expensive, non-deterministic, requires API keys)
- **On-chain**: State management, payments, access control (deterministic, transparent, trustless)

```
┌─────────────────┐     ┌──────────────────┐
│  AI Service      │     │  Smart Contracts  │
│  (FastAPI)       │────>│  (Solidity/EVM)   │
│  - LLM analysis  │     │  - Quality scores │
│  - Recommendations│     │  - Payments       │
│  - Content store │     │  - Access control │
└─────────────────┘     └──────────────────┘
```

The AI service has its own wallet and submits transactions like any other user. The smart contract doesn't know or care that the scorer is an AI — it just verifies the address is authorized.

## Content Verification

A powerful pattern is content hash verification. When an article is published:

1. The raw content is hashed (keccak256) off-chain
2. The hash is stored on-chain alongside the metadata
3. When a reader fetches the content, they can verify it matches the on-chain hash

This creates a tamper-proof content integrity guarantee without storing the full content on-chain (which would be prohibitively expensive).

## The ATXP Gateway Pattern

For hackathon projects and MVPs, using an LLM gateway like ATXP simplifies the AI integration:

- Single API key for multiple model providers (GPT, Claude, Gemini, Llama)
- OpenAI-compatible interface (drop-in replacement)
- Built-in billing and rate limiting

```python
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["ATXP_CONNECTION"],
    base_url="https://llm.atxp.ai/v1",
)

# Use any available model
result = client.chat.completions.create(
    model="gpt-4.1-mini",
    messages=[{"role": "user", "content": "Analyze..."}],
)
```

## Personalized Recommendations

Traditional recommendation systems rely on centralized data collection — tracking every click, scroll, and hover. In a Web3 context, the reading history is on-chain (which articles a wallet has paid for), making it transparent.

An AI recommendation engine can:
1. Query on-chain reading history for a wallet
2. Analyze patterns in the articles read
3. Rank unread articles by predicted relevance
4. Present recommendations without any centralized tracking

The reader's data stays on the public blockchain — no hidden tracking, no data silos, no "we sold your reading habits to advertisers."

## Challenges and Tradeoffs

This approach isn't without challenges:

- **Latency**: AI inference adds seconds to the publishing flow
- **Cost**: LLM API calls aren't free (though they're getting cheaper rapidly)
- **Determinism**: AI outputs aren't deterministic; two analyses of the same content may differ slightly
- **Privacy**: On-chain reading history is public (a tradeoff of transparency)

## The Bottom Line

AI and blockchain aren't competing technologies — they're complementary. Blockchain provides the trust layer (payments, ownership, access control), while AI provides the intelligence layer (analysis, recommendations, curation). Together, they enable applications that neither could build alone.""",
        "summary": "An exploration of how AI and blockchain work together in practice: autonomous AI agents with on-chain wallets, content hash verification, LLM gateway integration, and transparent recommendation systems without centralized tracking.",
        "reading_time": 5,
        "quality_score": 8.2,
        "tags": ["AI", "Web3", "Architecture", "Tutorial"],
        "seo_description": "How to build AI-powered blockchain applications: autonomous agents, content verification, LLM integration patterns, and decentralized recommendation systems.",
    },
]


async def seed():
    await init_db()
    for article in DEMO_ARTICLES:
        await create_article(
            article_id=article["id"],
            title=article["title"],
            content=article["content"],
            summary=article["summary"],
            reading_time=article["reading_time"],
            quality_score=article["quality_score"],
            tags=article["tags"],
            seo_description=article.get("seo_description", ""),
        )
        print(f"  Seeded article {article['id']}: {article['title']}")
    print(f"\nDone! Seeded {len(DEMO_ARTICLES)} articles.")


if __name__ == "__main__":
    asyncio.run(seed())
