import { Secp256k1Wallet } from "@cosmjs/amino"
import { u8aToHex } from "@polkadot/util"
import * as fs from "fs/promises"
import * as path from "path"
import chalk from "chalk"

import { config } from "../config"

import {
  getAddressFromRawSigner,
  getSeedFromMnemonic,
  getContractClient,
  getBaseClient,
  getPassword,
  getKeyPair,
  fmtList,
  log,
} from "../utils"

interface BalanceOptions {
  secret: Secp256k1Wallet
  contract: string
  address?: string
  json?: boolean
}

interface UploadOptions {
  secret: Secp256k1Wallet
  json?: boolean
}

interface CancelDeliveryOptions {
  secret: Secp256k1Wallet
  contract: string
  json?: boolean
}

interface InfoQueryOptions {
  query: "token_info" | "status" | "courier" | "funds" | "locations"
  secret: Secp256k1Wallet
  contract: string
  json?: boolean
}

export async function mnemonic_to_hex() {
  log(chalk.bold.bgBlue("Please enter mnemonic to convert"))

  const mnemonic = await getPassword()
  const seed = await getSeedFromMnemonic(mnemonic.trim())
  const keypair = await getKeyPair(seed)

  log(
    fmtList([
      // ["Mnemonic", mnemonic],
      ["Private Key", u8aToHex(keypair.privkey)],
      ["Public Key", u8aToHex(keypair.pubkey)],
    ]),
  )
}

export async function balance({ secret: signer, address, json }: BalanceOptions) {
  const signerAddress = getAddressFromRawSigner(signer)
  const client = await getBaseClient(signer)

  const _address = address || signerAddress 

  const { denom: stakeDenom, amount: stakeAmount } = await client.getBalance(
    _address,
    config.units.stake,
  )
  const { denom: feeDenom, amount: feeAmount } = await client.getBalance(
    _address,
    config.units.fee,
  )

  log(
    fmtList([
      ["Address", _address],

      ["Balance Stake", `${stakeAmount} ${stakeDenom}`],
      ["Balance Fee", `${feeAmount} ${feeDenom}`],
    ], json),
  )
}

export async function upload_contract({
  secret: signer,
  json,
}: UploadOptions) {
  const address = getAddressFromRawSigner(signer)
  const client = await getContractClient(signer)

  const file = await fs.readFile(path.join(__dirname, "../assets/figaro.wasm"))
  const wasm = file.slice(file.byteOffset, file.byteOffset + file.byteLength)
  const response = await client.upload(address, wasm, "auto")

  !json && log(chalk.bold.bgBlue("Contract uploaded"))

  log(
    fmtList([
      ["Code Id", response.codeId.toString()],
      ["Transaction Hash", response.transactionHash],
      ["Gas Used", response.gasUsed.toString()],
    ], json),
  )
}

export async function info({
  secret: signer,
  contract,
  query,
  json,
}: InfoQueryOptions) {
  const client = await getContractClient(signer)
  const response = await client.queryContractSmart(contract, { [query]: {} })

  !json && log(chalk.bold.bgBlue(`Contract "${contract}" ${query} info`))

  log(
    fmtList([
      ["Contract", contract],
      ["Query", query],
      ["Result", JSON.stringify(response, null, 2)],
    ], json),
  )
}

export async function cancel_delivery({ secret: signer, contract, json }: CancelDeliveryOptions) {
  const address = getAddressFromRawSigner(signer)
  const client = await getContractClient(signer)

  const { gasUsed, transactionHash, logs } = await client.execute(
    address,
    contract,
    { cancel_delivery: {} },
    "auto",
  )

  !json && log(chalk.bold.bgBlue("Delivery was cancelled"))

  log(
    fmtList([
      ["Contract Address", contract],
      ["Transaction Hash", transactionHash],
      ["Gas Used", gasUsed.toString()],
      ["Logs", JSON.stringify(logs, null, 2)],
    ], json),
  )
}
