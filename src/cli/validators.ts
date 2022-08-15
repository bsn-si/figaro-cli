import { InvalidArgumentError } from "commander"
import { Secp256k1Wallet } from "@cosmjs/amino"
import { hexToU8a } from "@polkadot/util/hex"
import BN from "bn.js"

import { config } from "../config"
import { getSignerFromSecretHex } from "../utils"

export const isValidAddress = (address: string) => {
  try {
    return address.length > 0
  } catch (error) {
    return false
  }
}

export const amount = (value: string) => {
  try {
    const number = new BN(value)
    return number
  } catch (error) {
    throw new InvalidArgumentError("Accepted only integer number")
  }
}

export const integer = (value: string) => {
  const number = parseInt(value)

  if (isNaN(number)) {
    throw new InvalidArgumentError("Accepted only integer number")
  }

  return number
}

export const address = (value: string) => {
  if (value && isValidAddress(value)) {
    return value
  } else {
    throw new InvalidArgumentError("Accepted only contract address in hex")
  }
}

export const secretKey = async (value: string) => {
  try {
    const wallet = await getSignerFromSecretHex(value)
    return wallet
  } catch (error) {
    throw new InvalidArgumentError("Accepted only 'Secp256k1' hex secret key")
  }
}

export const roughLocation = (value: string): [[number, number], [number, number]] => {
  try {
    const parsed = JSON.parse(value)
    let [start, end] = parsed as any

    if (!Array.isArray(start) || !Array.isArray(end)) {
      throw new InvalidArgumentError("Invalid format.")
    }

    start = exactLocation(start as any)
    end = exactLocation(end as any)

    return [start, end]
  } catch (error) {
    throw new InvalidArgumentError(
      "Expect json location rect like: [[lng,lat], [lng,lat]].\n" + error.message,
    )
  }
}

export const exactLocation = (value: string | [number, number]): [number, number] => {
  try {
    const location = typeof value === "string" ? JSON.parse(value) : value

    if (typeof location[0] !== "number" || typeof location[1] !== "number") {
      throw new InvalidArgumentError("Lng & Lat must be a number")
    }

    const [lng, lat] = location

    if (lat < -90 || lat > 90) {
      throw new InvalidArgumentError(
        "Latitude must be between -90 and 90 degrees inclusive.",
      )
    } else if (lng < -180 || lng > 180) {
      throw new InvalidArgumentError(
        "Longitude must be between -180 and 180 degrees inclusive.",
      )
    }

    return [lng, lat]
  } catch (error) {
    throw new InvalidArgumentError(
      "Expect json location rect like: [lng, lat].\n" + error.message,
    )
  }
}

export const publicKey = (value: string) => {
  try {
    return value
  } catch (error) {
    throw new InvalidArgumentError("error")
  }
}

export const contractQuery = (value: string) => {
  try {
    return value
  } catch (error) {
    throw new InvalidArgumentError("error")
  }
}

export const comment = (value: string) => {
  try {
    return value
  } catch (error) {
    throw new InvalidArgumentError("error")
  }
}
