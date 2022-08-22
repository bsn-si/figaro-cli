import { makeCosmoshubPath, OfflineSigner } from "@cosmjs/proto-signing"
import { GasPrice, SigningStargateClient } from "@cosmjs/stargate"
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { rawSecp256k1PubkeyToRawAddress } from "@cosmjs/amino"
import { Secp256k1Wallet } from "@cosmjs/amino"
import { toBech32 } from "@cosmjs/encoding"
import { hexToU8a } from "@polkadot/util"

import {
  Secp256k1Keypair,
  EnglishMnemonic,
  Slip10Curve,
  Secp256k1,
  Slip10,
  HdPath,
  Bip39,
} from "@cosmjs/crypto"

import { config } from "../config"

export const DEFAULT_HD_PATH = makeCosmoshubPath(0)

export const u8aEquals = (a: Uint8Array, b: Uint8Array) =>
  Array.isArray(a) &&
  Array.isArray(b) &&
  a.length === b.length &&
  a.every((val, index) => val === b[index])

export const getAddressFromRawSigner = (signer: any /* Secp256k1Wallet */) =>
  toBech32(config.addressPrefix, rawSecp256k1PubkeyToRawAddress(signer.pubkey))

export async function getKeyPair(
  seed: Uint8Array,
  hdPath: HdPath = DEFAULT_HD_PATH,
): Promise<Secp256k1Keypair> {
  const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath)
  const { pubkey } = await Secp256k1.makeKeypair(privkey)

  return {
    pubkey: Secp256k1.compressPubkey(pubkey),
    privkey: privkey,
  }
}

export async function getSeedFromMnemonic(mnemonic: string) {
  const mnemonicChecked = new EnglishMnemonic(mnemonic)
  const seed = await Bip39.mnemonicToSeed(mnemonicChecked)
  return seed
}

export async function getSignerFromSecretHex(secret: string) {
  const signer = Secp256k1Wallet.fromKey(hexToU8a(secret), config.addressPrefix)
  return signer
}

export async function getContractClient(signer: OfflineSigner) {
  const client = await SigningCosmWasmClient.connectWithSigner(config.apiUrl, signer, {
    gasPrice: GasPrice.fromString(`${config.gasPrice}${config.units.fee}`),
  })

  return client
}

export async function getBaseClient(signer: OfflineSigner) {
  const client = await SigningStargateClient.connectWithSigner(config.apiUrl, signer, {
    gasPrice: GasPrice.fromString(`${config.gasPrice}${config.units.fee}`),
  })

  return client
}

export async function payToContract(
  signer: OfflineSigner,
  contract: string,
  paymentType: "deposit" | "payment",
) {
  const address = getAddressFromRawSigner(signer)
  const client = await getContractClient(signer)

  // prettier-ignore
  const [ tokenAddress ] = await client.queryContractSmart(contract, { token_info: {} })
  const paymentInfo = await client.queryContractSmart(contract, { funds: {} })

  const action =
    paymentType === "payment" ? "make_pay_for_shipping" : "make_deposit_for_shipping"
  const amount = paymentInfo[paymentType]

  // Request allownance for make deposit
  await client.execute(
    address,
    tokenAddress,
    {
      increase_allowance: {
        spender: contract,
        amount,
      },
    },
    "auto",
  )

  const { transactionHash, gasUsed, logs } = await client.execute(
    address,
    contract,
    { [action]: {} },
    "auto",
  )

  return {
    transactionHash,
    contract,
    gasUsed,
    logs,
  }
}