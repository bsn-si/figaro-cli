import { fmtList, getAddressFromRawSigner, getContractClient, payToContract } from "../utils"
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
}

interface MakePaymentOptions {
  secret: Secp256k1Wallet
  contract: string
}

interface SetDetailsOptions {
  secret: Secp256k1Wallet
  contract: string

  locationFrom: [number, number],
  locationTo: [number, number],
  comment: string
}

interface ParcelIssuedOptions {
  secret: Secp256k1Wallet
  contract: string
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

  const response = await client.instantiate(
    address,
    contractCodeId,
    msg,
    "delivery-request",
    "auto",
  )

  console.log(chalk.bold.bgBlue("Contract Instantiated"))

  console.log(
    fmtList([
      ["Contract Address", response.contractAddress],
      ["Transaction Hash", response.transactionHash],
      ["Gas Used", response.gasUsed.toString()],
    ]),
  )
}

export async function make_payment({ secret: signer, contract }: MakePaymentOptions) {
  const { transactionHash, gasUsed, logs } = await payToContract(signer, contract, "payment")
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

export async function set_details({
  secret: signer,
  contract,

  locationFrom,
  locationTo,
  comment,
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
  
  console.log(chalk.bold.bgBlue("Set department and destination details"))
  console.log(
    fmtList([
      ["Contract Address", contract],
      ["Transaction Hash", transactionHash],
      ["Gas Used", gasUsed.toString()],
      ["Logs", JSON.stringify(logs, null, 2)],
    ]),
  )
}

export async function approve_parcel_issued({ secret: signer, contract }: ParcelIssuedOptions) {
  const address = getAddressFromRawSigner(signer)
  const client = await getContractClient(signer)

  const { gasUsed, transactionHash, logs } = await client.execute(
    address,
    contract,
    { parcel_issued: {} },
    "auto",
  )

  console.log(chalk.bold.bgBlue("Parcel delivered to courier"))

  console.log(
    fmtList([
      ["Contract Address", contract],
      ["Transaction Hash", transactionHash],
      ["Gas Used", gasUsed.toString()],
      ["Logs", JSON.stringify(logs, null, 2)],
    ]),
  )
}
