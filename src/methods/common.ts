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
} from "../utils"

interface BalanceOptions {
  secret: Secp256k1Wallet
  contract: string
}

interface UploadOptions {
  secret: Secp256k1Wallet
}

interface CancelDeliveryOptions {
  secret: Secp256k1Wallet
  contract: string
}

interface InfoQueryOptions {
  query: "token_info" | "status" | "courier" | "funds" | "locations"
  secret: Secp256k1Wallet
  contract: string
}

export async function mnemonic_to_hex() {
  console.log(chalk.bold.bgBlue("Please enter mnemonic to convert"))

  const mnemonic = await getPassword()
  const seed = await getSeedFromMnemonic(mnemonic.trim())
  const keypair = await getKeyPair(seed)

  console.log(
    fmtList([
      // ["Mnemonic", mnemonic],
      ["Private Key", u8aToHex(keypair.privkey)],
      ["Public Key", u8aToHex(keypair.pubkey)],
    ]),
  )
}

export async function balance({ secret: signer }: BalanceOptions) {
  const address = getAddressFromRawSigner(signer)
  const client = await getBaseClient(signer)

  const { denom: stakeDenom, amount: stakeAmount } = await client.getBalance(
    address,
    config.units.stake,
  )
  const { denom: feeDenom, amount: feeAmount } = await client.getBalance(
    address,
    config.units.fee,
  )

  console.log(
    fmtList([
      ["Address", address],

      ["Balance Stake", `${stakeAmount} ${stakeDenom}`],
      ["Balance Fee", `${feeAmount} ${feeDenom}`],
    ]),
  )
}

export async function upload_contract({
  secret: signer,
}: UploadOptions) {
  const address = getAddressFromRawSigner(signer)
  const client = await getContractClient(signer)

  const file = await fs.readFile(path.join(__dirname, "../assets/figaro.wasm"))
  const wasm = file.slice(file.byteOffset, file.byteOffset + file.byteLength)
  const response = await client.upload(address, wasm, "auto")

  console.log(chalk.bold.bgBlue("Contract uploaded"))

  console.log(
    fmtList([
      ["Code Id", response.codeId.toString()],
      ["Transaction Hash", response.transactionHash],
      ["Gas Used", response.gasUsed.toString()],
    ]),
  )
}

export async function info({
  secret: signer,
  contract,
  query,
}: InfoQueryOptions) {
  const client = await getContractClient(signer)
  const response = await client.queryContractSmart(contract, { [query]: {} })

  console.log(chalk.bold.bgBlue(`Contract "${contract}" ${query} info`))

  console.log(
    fmtList([
      ["Contract", contract],
      ["Query", query],
      ["Result", JSON.stringify(response, null, 2)],
    ]),
  )
}

export async function cancel_delivery({ secret: signer, contract }: CancelDeliveryOptions) {
  const address = getAddressFromRawSigner(signer)
  const client = await getContractClient(signer)

  const { gasUsed, transactionHash, logs } = await client.execute(
    address,
    contract,
    { cancel_delivery: {} },
    "auto",
  )

  console.log(chalk.bold.bgBlue("Delivery was cancelled"))

  console.log(
    fmtList([
      ["Contract Address", contract],
      ["Transaction Hash", transactionHash],
      ["Gas Used", gasUsed.toString()],
      ["Logs", JSON.stringify(logs, null, 2)],
    ]),
  )
}
