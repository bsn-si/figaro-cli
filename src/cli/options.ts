import { Argument, Option } from "commander"
import * as validator from "./validators"

// prettier-ignore
const cmdArguments = {
  secretKey: ["<secret_key>", "secp256k1 secret key in hex format", validator.secretKey],
  address: ["<address>", "address in bech32 format", validator.address],
}

// prettier-ignore
const cmdOptions = {
  contractAddress: ["--contract <bech32>", "contract address in bech32", validator.address],
  tokenAddress: ["--token <bech32>", "cw20 token contract address in bech32", validator.address],
  address: ["--address <bech32>", "address in bech32", validator.address],
  roughLocationFrom: ["--location-from <location>", "location rectangle for rough location. Format like 'lng,lat|lng,lat'", validator.roughLocation],
  roughLocationTo: ["--location-to <location>", "location rectangle for rough location. Format like 'lng,lat|lng,lat'", validator.roughLocation],
  exactLocationFrom: ["--location-from <location>", "exact location coordinates. Format like 'lng,lat'", validator.exactLocation],
  exactLocationTo: ["--location-to <location>", "exact location coordinates. Format like 'lng,lat'", validator.exactLocation],
  confirmPublicKey: ["--confirm-public <key>", "confirmation secp256k1 public key in hex format, for verify signature", validator.publicKey],
  depositAmount: ["--deposit <int>", "needed deposit from courier for delivery", validator.amount],
  paymentAmount: ["--payment <int>", "needed payment from sender for delivery", validator.amount],
  contractCodeId: ["--contract-code-id <int>", "contract code id for instantiate from existing code", validator.integer],
  confirmPrivateKey: ["--confirm-private <secret_key>", "secp256k1 secret key in hex format"],
  secretKey: ["--secret <secret_key>", "secp256k1 secret key in hex format", validator.secretKey],
  courier: ["--owner <bech32>", "owner address in bech32", validator.address],
  contractQuery: ["--query <msg>", "custom query for get contract details (token_info|status|courier|funds|locations)", validator.contractQuery],
  owner: ["--owner <bech32>", "owner address in bech32", validator.address],
  amount: ["--amount <int>", "amount of funds", validator.amount],
  comment: ["--comment <string>", "comment for courier", validator.comment],
  initial_balances: ["--initial-balances <addresses_with_balance>", "Accounts with initial balances. In format 'address_amount,addr_amount'", validator.initialBalances],
  minter: ["--minter <address_with_cap>", "mint option. In format 'address_amount'", validator.mint],
  decimals: ["--decimals <int>", "decimals option of cw20 instantiate", validator.integer],
  symbol: ["--symbol", "token symbol", validator.cw20symbol],
  name: ["--name", "token name", validator.cw20name],
}

export function getOption(name: string, isOptional = false) {
  const [_opt, desc, validator, choices] = cmdOptions[name]
  const opt = isOptional ? _opt : _opt.replaceAll("<", "[").replaceAll(">", "]")
  const option = new Option(opt, desc)

  if (isOptional) {
    option.optional = true
  } else {
    option.required = true
  }

  if (validator) {
    option.argParser(validator)
  }

  if (choices) {
    option.choices(choices)
  }

  return option
}

export function getArgument(name: string, isOptional = false) {
  const [opt, desc, validator] = cmdArguments[name]
  const option = new Argument(opt, desc)

  if (isOptional) {
    option.argOptional()
  }

  if (validator) {
    option.argParser(validator)
  }

  return option
}
