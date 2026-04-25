# MintBoard Smart Contracts

Four Solidity contracts deployed on the MintBoard appchain (Initia EVM rollup, `mintboard-1`).

## Contracts

| Contract | Purpose |
|----------|---------|
| **ContentRegistry.sol** | Article publishing, metadata storage, content hash verification |
| **MicroPayment.sol** | Prepaid reading wallet, per-read micropayments, multi-party revenue sharing (creator 87.5% / curator 10% / protocol 2.5%), curator reward claiming |
| **CurationAgent.sol** | AI quality scores on-chain, curator boost staking with ERC20 tokens |
| **MockOracle.sol** | Simulated INIT/USD price feed for dynamic pricing |

## Building

```bash
forge build
```

## Testing

```bash
forge test -vvv
```

65 tests covering: publishing, payments, fee splits, curator rewards, content verification, access control, and cross-contract integration.

## Deploying

```bash
# Deploy all contracts
forge script script/Deploy.s.sol --broadcast --rpc-url http://localhost:8545

# Or deploy individually with minitiad
jq -r '.bytecode.object' out/MicroPayment.sol/MicroPayment.json | sed 's/^0x//' | tr -d '\n' > contract.bin
minitiad tx evm create contract.bin --from gas-station --keyring-backend test --chain-id mintboard-1 --yes
```

## Key Design Decisions

- **ERC20-based deposits** instead of native `payable` — minievm uses `GAS` as the EVM native token (limited supply), but all user funds are in `umin`. Contracts use the umin ERC20 wrapper (`0x1D14AE89516E15E050bf6C4A1f549b9deB5f6EFb`) for deposits, withdrawals, and boost staking.
- **Content hash verification** — keccak256 hash of article content stored on-chain at publish time. Frontend verifies integrity before displaying.
- **Proportional curator rewards** — curators who boost articles early earn a share of future reads proportional to their stake.
