import * as courier from "./courier"
import * as common from "./common"
import * as sender from "./sender"
import { log } from "../utils"

const methods = {
  courier,
  common,
  sender,
}

export function getMethod(group: string, method: string): (...args) => Promise<void> {
  const _default = async (_, ...args) => log("void", args)
  const _fn = methods?.[group]?.[method]

  return _fn ? _fn : _default
}
