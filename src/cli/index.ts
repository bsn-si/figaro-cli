import { getMethod } from "../methods"
import { config } from "../config"
import { parse } from "./parser"

export async function cli() {
  try {
    const { argument, options, command, method } = parse(process.argv)
    const action = getMethod(command, method)

    // check await validators with value (simple crutch for cli parser)
    for (const key in options) {
      if (options[key] instanceof Promise) {
        const value = await options[key]
        options[key] = value
      }
    }

    const args: any = [options]

    if (argument.length > 0) {
      args.splice(1, 0, ...argument)
    }

    await action(...args)
  } catch (error) {
    if (config.trace) {
      console.error(error)
    }

    process.exit(1)
  }
}
