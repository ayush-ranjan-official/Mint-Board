# MintBoard — AI Content Micropayment Platform

## Initia Hackathon Submission

- **Project Name**: MintBoard
- **Track**: AI
- **Tagline**: "Medium meets micropayments — creators keep 97%, readers pay per article, AI powers discovery."

### Project Overview

MintBoard is a decentralized content publishing platform where creators publish articles and readers pay tiny amounts per article read — no subscription required. An off-chain AI service generates summaries, reading-time estimates, and quality scores. An autonomous AI curator agent with its own wallet scores articles on-chain. Deployed as its own Initia appchain (EVM) on testnet, every micropayment generates appchain revenue. Creators keep 97.5%. All tokens are testnet tokens with no real-world value.

### Implementation Detail

- **The Custom Implementation**: A three-contract architecture (ContentRegistry + MicroPayment + CurationAgent) enabling per-article micropayments with a prepaid reading wallet model. Readers deposit once, reads deduct automatically via auto-signed transactions. An autonomous AI curator agent has its own wallet and submits quality scores on-chain. Multi-party revenue sharing splits payments between creators (87.5%), curators (10%), and the protocol (2.5%). Content hash verification ensures article integrity. A mock oracle enables USD-equivalent dynamic pricing.

- **The Native Feature**: Auto-signing enables seamless per-article micropayments — readers approve a session once and every article they open charges automatically without wallet popups. The AI curator agent also uses auto-signing for autonomous on-chain score submissions. The Interwoven Bridge lets readers fund their reading wallet from L1. Initia Usernames (.init) serve as the creator identity throughout the platform.

### Architecture

```
┌──────────────────┐    ┌──────────────────────────┐
│  Frontend (React) │    │  AI Service (Python)      │
│  + InterwovenKit  │    │  FastAPI + ATXP Gateway   │
│  + Wagmi + Viem   │◄──►│  + Curator Agent (own     │
│  + TailwindCSS    │    │    wallet, auto-signing)  │
└────────┬─────────┘    └───────────┬──────────────┘
         │                          │
         ▼                          ▼
┌───────────────────────────────────────────────────┐
│          Initia Appchain (EVM Rollup — TESTNET)    │
│                                                     │
│  ContentRegistry.sol  MicroPayment.sol  CurationAgent.sol
│  + Content hashes     + Revenue splits  + AI scores
│  + Article metadata   + Reader wallets  + Curator boosts
│                                                     │
│  Gas: umin (testnet) · Fee: 2.5% protocol           │
└───────────────────────────────────────────────────┘
```

### Smart Contracts

| Contract | Purpose |
|----------|---------|
| `ContentRegistry.sol` | Article publishing, metadata, content hash verification |
| `MicroPayment.sol` | Deposits, per-read charges, multi-party revenue sharing |
| `CurationAgent.sol` | AI quality scores on-chain, curator boost staking |
| `MockOracle.sol` | Simulated INIT/USD price feed for dynamic pricing |

### Initia Native Features

1. **Auto-Signing** — Readers approve once, then every article read charges automatically (no wallet popups). The AI curator agent also uses its own auto-signed transactions.
2. **Interwoven Bridge** — Readers bridge INIT tokens from L1 testnet to fund their reading wallet on the appchain.
3. **Initia Usernames** — Creators are identified by `.init` usernames throughout the platform, never raw hex addresses.

### How to Run Locally

**Prerequisites:** Go 1.21+, Node.js 18+, Python 3.9+, Foundry

1. **Set up the Initia appchain:**
   ```bash
   # Install tools
   bash .agents/skills/initia-appchain-dev/scripts/install-tools.sh

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
   forge build
   forge script script/Deploy.s.sol --broadcast --rpc-url http://localhost:8545
   # Note the deployed addresses and update frontend/src/config/chains.js
   ```

3. **Start AI service:**
   ```bash
   cd ai-service
   pip install -r requirements.txt
   python seed_articles.py
   uvicorn main:app --port 8000
   ```

4. **Start frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Revenue Model

| Recipient | Share | When |
|-----------|-------|------|
| Creator | 87.5–97.5% | Every article read |
| Curator Pool | 0–10% | When article has curator boosts |
| Protocol | 2.5% | Every article read |

### Tech Stack

- **Blockchain**: Initia EVM Appchain (Solidity + Foundry)
- **Frontend**: React + Vite + InterwovenKit + wagmi + viem
- **AI Service**: Python FastAPI + ATXP LLM Gateway
- **Storage**: SQLite (article content), On-chain (ownership, payments, scores)

> **Note:** This project runs entirely on Initia testnet. All tokens are testnet tokens with no real value. The only external paid service is ATXP LLM Gateway for AI inference.
