# MintBoard — AI Content Micropayment Platform

## Initia Hackathon Submission

- **Project Name**: MintBoard
- **Track**: AI
- **Tagline**: "Every read rewards the creator — 97.5% goes to the writer, AI powers discovery, blockchain is invisible."

### Project Overview

MintBoard is a decentralized content publishing platform where creators publish articles and readers pay tiny amounts per article read — no subscription required. An off-chain AI service generates summaries, reading-time estimates, quality scores, and personalized recommendations. An autonomous AI curator agent with its own wallet scores articles on-chain. Deployed as its own Initia appchain (EVM) on testnet, every micropayment generates appchain revenue. Creators keep 97.5%. All tokens are testnet tokens with no real-world value.

### Implementation Detail

- **The Custom Implementation**: A four-contract architecture (ContentRegistry + MicroPayment + CurationAgent + MockOracle) enabling per-article micropayments with a prepaid reading wallet model. Readers deposit ERC20 tokens (umin) once, then reads deduct automatically via auto-signed transactions using `submitTxBlock` for headless UX. An autonomous AI curator agent has its own wallet and submits quality scores on-chain. Multi-party revenue sharing splits payments between creators (87.5%), curators (10%), and the protocol (2.5%). Curators can claim proportional rewards. Content hash verification (keccak256) ensures article integrity — verified on-chain with a green/red badge. A mock oracle enables USD-equivalent dynamic pricing displayed on article cards.

- **The Native Feature**: Auto-signing enables seamless per-article micropayments — readers approve a session once and every article they open charges automatically without wallet popups (using InterwovenKit's `submitTxBlock` for headless transactions). The Interwoven Bridge lets readers fund their reading wallet from L1. Initia Usernames (.init) serve as the creator identity throughout the platform — in the navbar, on articles, and in dashboards.

### Architecture

```
┌──────────────────┐    ┌──────────────────────────┐
│  Frontend (React) │    │  AI Service (Python)      │
│  + InterwovenKit  │    │  FastAPI + ATXP Gateway   │
│  + Wagmi + Viem   │◄──►│  + Curator Agent (own     │
│  + Custom Hooks   │    │    wallet, auto-signing)  │
└────────┬─────────┘    └───────────┬──────────────┘
         │                          │
         ▼                          ▼
┌───────────────────────────────────────────────────┐
│          Initia Appchain (EVM Rollup — TESTNET)    │
│                                                     │
│  ContentRegistry.sol  MicroPayment.sol  CurationAgent.sol
│  + Content hashes     + ERC20 deposits  + AI scores
│  + Article metadata   + Revenue splits  + Curator boosts
│  + Verification       + Reward claims   + Featured list
│                                                     │
│  MockOracle.sol — USD-equivalent dynamic pricing    │
│  Gas: umin (testnet) · Fee: 2.5% protocol           │
└───────────────────────────────────────────────────┘
```

### Smart Contracts (65 tests passing)

| Contract | Address | Purpose |
|----------|---------|---------|
| `ContentRegistry.sol` | `0xccA98Ddfd374f257c676e18710c0837e2Ab5eBeB` | Article publishing, metadata, content hash verification |
| `MicroPayment.sol` | `0x5e268621B61E10f1296A5C53A10ec05D0Cd3cAb8` | ERC20 deposits, per-read charges, multi-party revenue sharing, curator reward claims |
| `CurationAgent.sol` | `0x8DBDc3D60381531E7c465303262F1a73Dbf9a72F` | AI quality scores on-chain, ERC20 curator boost staking |
| `MockOracle.sol` | `0xa86001607C0e2a1ce6324B99b0A8694d7cC7d7ad` | Simulated INIT/USD price feed ($2.00/MIN) |

### Initia Native Features

1. **Auto-Signing** — Readers approve once, then every article read charges automatically (no wallet popups). Uses `submitTxBlock` for truly headless transactions. The AI curator agent also submits autonomous on-chain scores.
2. **Interwoven Bridge** — Readers bridge INIT tokens from L1 testnet to fund their reading wallet on the appchain.
3. **Initia Usernames** — Creators are identified by `.init` usernames throughout the platform, never raw hex addresses.

### AI-Powered Features

- **Content Analysis** — AI generates summaries, reading time, quality scores (1-10), and tags for every published article via ATXP LLM Gateway
- **Personalized Recommendations** — "Recommended for You" section with per-article AI reasoning (e.g., "Top pick for you — covers DeFi in depth — Highly rated (8.8/10)")
- **Autonomous Curator Agent** — Background service that monitors new articles, scores quality via LLM, and submits ratings on-chain with its own wallet
- **Content Verification** — keccak256 hash stored on-chain at publish time, verified in the frontend with green/red badge

### How to Run Locally

**Prerequisites:** Go 1.21+, Node.js 18+, Python 3.9+, Foundry, Docker

1. **Set up the Initia appchain:**
   ```bash
   # Install tools (weave, initiad)
   brew install go
   brew tap initia-labs/tap && brew install weave

   # Build minitiad (EVM)
   git clone --depth 1 https://github.com/initia-labs/minievm.git /tmp/minievm
   cd /tmp/minievm && make install && rm -rf /tmp/minievm

   # Initialize and start the appchain
   weave init  # Select: Launch rollup → Testnet → EVM → mintboard-1 → umin → Oracle enabled
   weave opinit init executor && weave opinit start executor -d
   weave relayer init && weave relayer start -d
   ```

2. **Deploy contracts:**
   ```bash
   cd contracts
   forge install  # Install forge-std and OpenZeppelin
   forge build
   forge script script/Deploy.s.sol --broadcast --rpc-url http://localhost:8545
   # Update frontend/src/config/chains.js with deployed addresses
   ```

3. **Start AI service:**
   ```bash
   cd ai-service
   pip install -r requirements.txt
   cp .env.example .env  # Add your ATXP_CONNECTION key
   python seed_articles.py
   uvicorn main:app --port 8000
   ```

4. **Start frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   # Opens at http://localhost:5173
   ```

### Revenue Model

| Recipient | Share | When |
|-----------|-------|------|
| Creator | 87.5–97.5% | Every article read |
| Curator Pool | 0–10% | When article has active curator boosts |
| Protocol | 2.5% | Every article read |

### Tech Stack

- **Blockchain**: Initia EVM Appchain (Solidity 0.8.24 + Foundry)
- **Frontend**: React + Vite + InterwovenKit + wagmi + viem
- **AI Service**: Python FastAPI + ATXP LLM Gateway (OpenAI-compatible)
- **Storage**: SQLite (article content), On-chain (ownership, payments, scores)
- **Oracle**: MockOracle for USD-equivalent dynamic pricing

### Frontend Pages

| Page | Path | Features |
|------|------|----------|
| Discover | `/` | Article feed, AI recommendations, auto-sign banner |
| Article | `/article/:id` | Auto-pay reading, content verification badge, boost |
| Publish | `/publish` | AI analysis, content hash, on-chain publish |
| Earnings | `/creator` | Creator earnings, per-article breakdown, curator boosts, reward claiming |
| Wallet | `/reader` | Reading credits, deposit, bridge, auto-pay toggle, reading history |
| About | `/about` | Platform explainer, revenue model, comparison table |

> **Note:** This project runs entirely on Initia testnet. All tokens are testnet tokens with no real value. The only external paid service is ATXP LLM Gateway for AI inference.
