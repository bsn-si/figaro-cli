#!/bin/bash
set -o errexit -o nounset -o pipefail

CHAIN_ID=${CHAIN_ID:-localnet}
STAKE=${STAKE_TOKEN:-ustake}
MONIKER=${MONIKER:-node001}
FEE=${FEE_TOKEN:-ufee}

rm -rf "$HOME"/.wasmd/
wasmd init --chain-id "$CHAIN_ID" "$MONIKER"

sed -i. "s/\"stake\"/\"$STAKE\"/" "$HOME"/.wasmd/config/genesis.json
sed -i -r 's/minimum-gas-prices = ""/minimum-gas-prices = "0.025'$FEE'"/' ${HOME}/.wasmd/config/app.toml

if ! wasmd keys show validator; then
  wasmd keys add validator
fi

# hardcode the validator account for this instance
wasmd add-genesis-account validator "1000000000$STAKE,1000000000$FEE"

# (optionally) add a few more genesis accounts
for addr in "$@"; do
  echo "$addr"
  wasmd add-genesis-account "$addr" "1000000000$STAKE,1000000000$FEE"
done

# submit a genesis validator tx
## Workraround for https://github.com/cosmos/cosmos-sdk/issues/8251
wasmd gentx validator "250000000$STAKE" --chain-id="$CHAIN_ID" --amount="250000000$STAKE"

## should be:
wasmd collect-gentxs