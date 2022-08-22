import { hexToU8a, u8aToHex } from "@polkadot/util"
import { Secp256k1, Sha256 } from "@cosmjs/crypto"
import { Secp256k1Wallet } from "@cosmjs/amino"
import { TextEncoder } from "util"
import chalk from "chalk"

export { cancel_delivery } from "./common"
import { config } from "../config"

import {
  getAddressFromRawSigner,
  getContractClient,
  payToContract,
  fmtList,
  log,
} from "../utils"

interface RequestListOptions {
  secret: Secp256k1Wallet
  contractCodeId: number
  json?: boolean
}

interface MakeDepositOptions {
  secret: Secp256k1Wallet
  contract: string
  json?: boolean
}

interface AcceptRequestOptions {
  secret: Secp256k1Wallet
  contract: string
  json?: boolean
}

interface ConfirmDeliveryOptions {
  secret: Secp256k1Wallet
  confirmPrivate: string
  contract: string
  json?: boolean
}

export async function requests_list({
  secret: signer,
  contractCodeId,
  json,
}: RequestListOptions) {
  const client = await getContractClient(signer)
  const addresses = await client.getContracts(contractCodeId)

  const contracts = await Promise.all(
    addresses.map(address =>
      (async () => {
        const [tokenAddress, tokenInfo] = await client.queryContractSmart(address, {
          token_info: {},
        })
        
        const locations = await client.queryContractSmart(address, { locations: {} })
        const courier = await client.queryContractSmart(address, { courier: {} })
        const status = await client.queryContractSmart(address, { status: {} })
        const funds = await client.queryContractSmart(address, { funds: {} })

        return {
          locations,
          address,
          courier,
          status,
          funds,

          tokenInfo: {
            address: tokenAddress,
            ...tokenInfo,
          },
        }
      })(),
    ),
  )

  if (config.logging) {
    if (json) {
      log(JSON.stringify(contracts))
    } else {
      for (const { address, locations, courier, funds, status, tokenInfo } of contracts) {
        log(chalk.bgBlue.bold(`[${status}] ${address}`))
        log(fmtList([
          ["Locations", `from: ${JSON.stringify(locations.rough.from)}, to: ${JSON.stringify(locations.rough.to)}`],
          ["Courier", courier.length ? courier : "Not applied"],
          ["Funds", `deposit: ${funds.deposit}, payment: ${funds.payment}`],
          ["Token", `name: ${tokenInfo.name}, address: ${tokenInfo.address}`],
        ]))
        log("-------------------\n")
      }
    }
  }
}

export async function make_deposit({ secret: signer, contract, json }: MakeDepositOptions) {
  const { transactionHash, gasUsed, logs } = await payToContract(
    signer,
    contract,
    "deposit",
  )

  !json && log(chalk.bold.bgBlue("Delivery make payment"))

  log(
    fmtList([
      ["Contract Address", contract],
      ["Transaction Hash", transactionHash],
      ["Gas Used", gasUsed.toString()],
      ["Logs",  logs],
    ], json),
  )
}

export async function accept_request({ secret: signer, contract, json }: AcceptRequestOptions) {
  const address = getAddressFromRawSigner(signer)
  const client = await getContractClient(signer)

  const { gasUsed, transactionHash, logs } = await client.execute(
    address,
    contract,
    { accept_application: {} },
    "auto",
  )

  !json && log(chalk.bold.bgBlue("Accept delivery request"))

  log(
    fmtList([
      ["Contract Address", contract],
      ["Transaction Hash", transactionHash],
      ["Gas Used", gasUsed.toString()],
      ["Logs",  logs],
    ], json),
  )
}

export async function confirm_delivery({
  secret: signer,
  confirmPrivate,
  contract,
  json,
}: ConfirmDeliveryOptions) {
  const address = getAddressFromRawSigner(signer)
  const client = await getContractClient(signer)

  const message = new Sha256(new TextEncoder().encode(contract)).digest()
  const signature = await Secp256k1.createSignature(message, hexToU8a(confirmPrivate))
  const signatureBytes = new Uint8Array([...signature.r(32), ...signature.s(32)])
  const hex = u8aToHex(signatureBytes, undefined, false)

  const { gasUsed, transactionHash, logs } = await client.execute(
    address,
    contract,
    { confirm_delivery: { sign: hex } },
    "auto",
  )

  !json && log(chalk.bold.bgBlue("Confirm delivery, payout successful"))

  log(
    fmtList([
      ["Contract Address", contract],
      ["Transaction Hash", transactionHash],
      ["Gas Used", gasUsed.toString()],
      ["Logs",  logs],
    ], json),
  )
}
