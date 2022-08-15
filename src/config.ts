import * as path from "path"
import * as fs from "fs"
import * as os from "os"
import chalk from "chalk"

import { log } from "./utils"

export const config = {
  // show result for all command
  logging: true,
  // trace errors in output
  trace: true,
  // default endpoint address to node
  apiUrl: "http://127.0.0.1:26657",
  // default beck32 address prefix
  addressPrefix: "wasm",
  // default gas price for calls
  gasPrice: "0.25",
  // display options
  display: {
    // show and log all addresses for user & contracts in bech32 format
    beck32: true,
  },
  // amount units name
  units: {
    stake: "ustake",
    fee: "ufee",
  }
}

export const DEFAULT_DATA_DIR = path.join(os.homedir(), ".figaro")
export const DATA_DIR = process.env.DATA_DIR || DEFAULT_DATA_DIR
export const CONFIG_PATH = path.join(DATA_DIR, "config.json")

export function extendsConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const file = fs.readFileSync(CONFIG_PATH, "utf-8")
      const params = JSON.parse(file)
      Object.assign(config, params)
    } else {
      fs.mkdirSync(DATA_DIR, { recursive: true })
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8")
    }
  } catch (error) {
    log(chalk.black.bgRed.bold(`Invalid JSON config at ${CONFIG_PATH}`))
  }
}
