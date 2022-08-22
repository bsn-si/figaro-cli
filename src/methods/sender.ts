import { fmtList, getAddressFromRawSigner, getContractClient, log, payToContract } from "../utils"
import { Secp256k1Wallet } from "@cosmjs/amino"
import chalk from "chalk"
import BN from "bn.js"

export { cancel_delivery } from "./common"

interface InstantiateOptions {
  locationFrom: [[number, number], [number, number]]
  locationTo: [[number, number], [number, number]]
  secret: Secp256k1Wallet
  contractCodeId: number
  confirmPublic: string
  token: string
  deposit: BN
  payment: BN

  json?: boolean
}

interface MakePaymentOptions {
  secret: Secp256k1Wallet
  contract: string
  json?: boolean
}

interface SetDetailsOptions {
  secret: Secp256k1Wallet
  contract: string

  locationFrom: [number, number],
  locationTo: [number, number],
  comment: string
  
  json?: boolean
}

interface ParcelIssuedOptions {
  secret: Secp256k1Wallet
  contract: string
  json?: boolean
}

export async function instantiate({
  secret: signer,
  contractCodeId,
  confirmPublic,
  locationFrom,
  locationTo,
  deposit,
  payment,
  token,
  json,
}: InstantiateOptions) {
  const address = getAddressFromRawSigner(signer)
  const client = await getContractClient(signer)

  const msg = {
    location: { from: JSON.stringify(locationFrom), to: JSON.stringify(locationTo) },
    confirm_public_key: confirmPublic,
    deposit_amount: deposit.toString(),
    payment_amount: payment.toString(),
    token_address: token,
  }

  const { contractAddress, transactionHash, gasUsed } = await client.instantiate(
    address,
    contractCodeId,
    msg,
    "delivery-request",
    "auto",
  )

  !json && log(chalk.bold.bgBlue("Contract Instantiated"))

  log(
    fmtList([
      ["Contract Address", contractAddress],
      ["Transaction Hash", transactionHash],
      ["Gas Used", gasUsed.toString()],
    ], json),
  )
}

export async function make_payment({ secret: signer, contract, json }: MakePaymentOptions) {
  const { transactionHash, gasUsed, logs } = await payToContract(signer, contract, "payment")
  !json && log(chalk.bold.bgBlue("Delivery make payment"))

  log(
    fmtList([
      ["Contract Address", contract],
      ["Transaction Hash", transactionHash],
      ["Gas Used", gasUsed.toString()],
      ["Logs", logs],
    ], json),
  )
}

export async function set_details({
  secret: signer,
  contract,

  locationFrom,
  locationTo,
  comment,

  json,
}: SetDetailsOptions) {
  const address = getAddressFromRawSigner(signer)
  const client = await getContractClient(signer)

  const msg = {
    set_details: {
      comment,
      location: {
        from: JSON.stringify(locationFrom),
        to: JSON.stringify(locationTo),
      }
    }
  }

  const { gasUsed, transactionHash, logs } = await client.execute(address, contract, msg, "auto")
  
  !json && log(chalk.bold.bgBlue("Set department and destination details"))

  log(
    fmtList([
      ["Contract Address", contract],
      ["Transaction Hash", transactionHash],
      ["Gas Used", gasUsed.toString()],
      ["Logs",  logs],
    ], json),
  )
}

export async function approve_parcel_issued({ secret: signer, contract, json }: ParcelIssuedOptions) {
  const address = getAddressFromRawSigner(signer)
  const client = await getContractClient(signer)

  const { gasUsed, transactionHash, logs } = await client.execute(
    address,
    contract,
    { parcel_issued: {} },
    "auto",
  )

  !json && log(chalk.bold.bgBlue("Parcel delivered to courier"))

  log(
    fmtList([
      ["Contract Address", contract],
      ["Transaction Hash", transactionHash],
      ["Gas Used", gasUsed.toString()],
      ["Logs",  logs],
    ], json),
  )
}
