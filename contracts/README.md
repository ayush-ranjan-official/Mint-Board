# EVM Contract Project

## Building
```bash
forge build
```

## Deploying with minitiad
Minitiad requires raw hex bytecode. Use the following to extract it:
```bash
jq -r '.bytecode.object' out/YourContract.sol/YourContract.json | sed 's/^0x//' | tr -d '\n' > your-contract.bin
minitiad tx evm create your-contract.bin --from gas-station --chain-id <chain-id> --yes
```

## Interacting
Encode your calls using `cast`:
```bash
# Get calldata
DATA=$(cast calldata "functionName(type)" arg1)
# Send transaction
minitiad tx evm call <contract-address> $DATA --from gas-station --chain-id <chain-id> --yes
```
