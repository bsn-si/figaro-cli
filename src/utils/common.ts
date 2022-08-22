import { snakeCase } from "snake-case"
import * as readline from "readline"
import chalk from "chalk"

import { config } from "../config"

export function getPassword(): Promise<string> {
  return new Promise((resolve, reject) => {
    const rl: any = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.stdoutMuted = true

    rl.question("Account Password: ", (password: string) => {
      log("\n")

      if (!password.length) {
        reject(new Error("password cannot be empty"))
      } else {
        resolve(password)
      }

      rl.close()
    })

    rl._writeToOutput = stringToWrite => {
      if (rl.stdoutMuted) rl.output.write("*")
      else rl.output.write(stringToWrite)
    }
  })
}

export function log(...args) {
  if (config.logging) {
    console.log(...args)
  }
}

export const fmtWidth = (message: string, width: number) => {
  const rest = width - message.length
  const ws = new Array(rest > 0 ? rest : 1).join(" ")
  return message + ws
}

export const fmtList = (
  list: ([string, any] | [string, any, string])[],
  json = false,
) => {
  if (json) {
    const obj: any = {}

    list.forEach(([title, value]) => {
      obj[snakeCase(title)] = value
    })

    return JSON.stringify(obj)
  } else {
    let message = ""

    list.forEach(([title, _value, bgStyle]) => {
      const styledBg = bgStyle ? chalk[bgStyle] : chalk
      const styledText = bgStyle ? chalk.black : chalk
      const value = typeof _value === "object" ? JSON.stringify(_value, null, 2) : _value

      message += styledBg(
        styledText.bold(fmtWidth(title, 20)),
        value ? styledText(value) : "",
        "\n",
      )
    })

    return message
  }
}
