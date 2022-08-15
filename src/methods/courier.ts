import { hexToU8a, u8aToHex } from "@polkadot/util"
import { Secp256k1, Sha256 } from "@cosmjs/crypto"
import { Secp256k1Wallet } from "@cosmjs/amino"
import { TextEncoder } from "util"
import chalk from "chalk"

import {
  getAddressFromRawSigner,
  getContractClient,
  payToContract,
  fmtList,
} from "../utils"

export { cancel_delivery } from "./common"

interface MakeDepositOptions {
  secret: Secp256k1Wallet
  contract: string
}

interface AcceptRequestOptions {
  secret: Secp256k1Wallet
  contract: string
}

interface ConfirmDeliveryOptions {
  secret: Secp256k1Wallet
  confirmPrivate: string
  contract: string
}

export async function make_deposit({ secret: signer, contract }: MakeDepositOptions) {
  const { transactionHash, gasUsed, logs } = await payToContract(
    signer,
    contract,
    "deposit",
  )

  console.log(chalk.bold.bgBlue("Delivery make payment"))

  console.log(
    fmtList([
      ["Contract Address", contract],
      ["Transaction Hash", transactionHash],
      ["Gas Used", gasUsed.toString()],
      ["Logs", JSON.stringify(logs, null, 2)],
    ]),
  )
}

export async function accept_request({ secret: signer, contract }: AcceptRequestOptions) {
  const address = getAddressFromRawSigner(signer)
  const client = await getContractClient(signer)

  const { gasUsed, transactionHash, logs } = await client.execute(
    address,
    contract,
    { accept_application: {} },
    "auto",
  )

  console.log(chalk.bold.bgBlue("Accept delivery request"))

  console.log(
    fmtList([
      ["Contract Address", contract],
      ["Transaction Hash", transactionHash],
      ["Gas Used", gasUsed.toString()],
      ["Logs", JSON.stringify(logs, null, 2)],
    ]),
  )
}

export async function confirm_delivery({
  secret: signer,
  confirmPrivate,
  contract,
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

  console.log(chalk.bold.bgBlue("Confirm delivery, payout successful"))

  console.log(
    fmtList([
      ["Contract Address", contract],
      ["Transaction Hash", transactionHash],
      ["Gas Used", gasUsed.toString()],
      ["Logs", JSON.stringify(logs, null, 2)],
    ]),
  )
}
