import { u8aToHex, hexToU8a } from "@polkadot/util"
import { InvalidArgumentError } from "commander"
import BN from "bn.js"

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
    const regexp = new RegExp(/^(.*?)\|(.*?)$/g)
    const [matched] = Array.from(value.trim().matchAll(regexp))

    const start = exactLocation(matched[1])
    const end = exactLocation(matched[2])

    return [start, end]
  } catch (error) {
    throw new InvalidArgumentError(
      "Expect json location rect like: '1.0,1.0|2.0,2.0'\n" + error.message,
    )
  }
}

export const exactLocation = (value: string | [number, number]): [number, number] => {
  try {
    const regexp = new RegExp(/^([+-]?\d+(\.\d+)),([+-]?\d+(\.\d+))$/g)

    const location = typeof value === "string" ? ((() => {
      const [ matched ] = Array.from(value.trim().matchAll(regexp))
      const lng = parseFloat(matched[1])
      const lat = parseFloat(matched[3])
      return [lng, lat]
    })()) : value

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
      "Expect json location rect like: '1.0,1.0'.\n" + error.message,
    )
  }
}

export const publicKey = (value: string) => {
  try {
    const bytes = hexToU8a(value)

    if (bytes.length !== 33) {
      throw new Error()
    }
 
    return u8aToHex(bytes, undefined, false)
  } catch (error) {
    throw new InvalidArgumentError("Accepted only 33 bytes secp256k1 public key in hex")
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
