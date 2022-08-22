import { getOption } from "./options"
import { Command } from "commander"
const { assign } = Object

export interface CliMethod {
  options: Record<string, any>
  argument: string[]
  command: string
  method: string
}

export function parse(argv: string[]): CliMethod {
  let parsed

  const setParsed: any =
    (command: string) =>
    (...args) => {
      const {
        processedArgs: argument,
        _optionValues: options,
        _name: method,
      } = args[args.length - 1]

      parsed = {
        argument,
        command,
        options,
        method,
      }
    }

  const program = new Command()
    .name("figaro-cli")
    .description("Tool for interact with figaro - manage requests & delivery")
    .option("--json", "Output all results as json")
    .version("0.1.0")

  const sender = new Command("sender")
    .description("Interact as sender")
    .addCommand(
      new Command("instantiate")
        .description("Create new request for delivery & instantiate contract")
        .addOption(getOption("secretKey"))
        .addOption(getOption("roughLocationFrom"))
        .addOption(getOption("roughLocationTo"))
        .addOption(getOption("tokenAddress"))
        .addOption(getOption("confirmPublicKey"))
        .addOption(getOption("depositAmount"))
        .addOption(getOption("paymentAmount"))
        .addOption(getOption("contractCodeId"))
        .action(setParsed("sender")),
    )
    .addCommand(
      new Command("make_payment")
        .description("Make payment for delivery")
        .addOption(getOption("contractAddress"))
        .addOption(getOption("secretKey"))
        .action(setParsed("sender")),
    )
    .addCommand(
      new Command("set_details")
        .description("Set details like exact location and comment")
        .addOption(getOption("contractAddress"))
        .addOption(getOption("secretKey"))
        .addOption(getOption("exactLocationFrom"))
        .addOption(getOption("exactLocationTo"))
        .addOption(getOption("comment"))
        .action(setParsed("sender")),
    )
    .addCommand(
      new Command("approve_parcel_issued")
        .description("Approve for parcel issued to courier")
        .addOption(getOption("contractAddress"))
        .addOption(getOption("secretKey"))
        .action(setParsed("sender")),
    )
    .addCommand(
      new Command("cancel_delivery")
        .description("Cancel delivery")
        .addOption(getOption("contractAddress"))
        .addOption(getOption("secretKey"))
        .action(setParsed("sender")),
    )

  const courier = new Command("courier")
    .description("Interact as courier")
    .addCommand(
      new Command("requests_list")
        .description("Show list of existed requests by contract code id")
        .addOption(getOption("contractCodeId"))
        .addOption(getOption("secretKey"))
        .action(setParsed("courier")),
    )
    .addCommand(
      new Command("accept_request")
        .description("Accept for delivery as courier")
        .addOption(getOption("contractAddress"))
        .addOption(getOption("secretKey"))
        .action(setParsed("courier")),
    )
    .addCommand(
      new Command("make_deposit")
        .description("Make deposit for delivery")
        .addOption(getOption("contractAddress"))
        .addOption(getOption("secretKey"))
        .action(setParsed("courier")),
    )
    .addCommand(
      new Command("confirm_delivery")
        .description("Confirm delivery and get funds")
        .addOption(getOption("contractAddress"))
        .addOption(getOption("secretKey"))
        .addOption(getOption("confirmPrivateKey"))
        .action(setParsed("courier")),
    )
    .addCommand(
      new Command("cancel_delivery")
        .description("Cancel delivery")
        .addOption(getOption("contractAddress"))
        .addOption(getOption("secretKey"))
        .action(setParsed("courier")),
    )

  const common = new Command("common")
    .description("Shared command & contract query for everyone")
    .addCommand(
      new Command("mnemonic_to_hex")
        .description("Convert user mnemonic to hex private key secp256k1")
        .action(setParsed("common")),
    )
    .addCommand(
      new Command("balance")
        .description("Get account balance")
        .addOption(getOption("secretKey"))
        .addOption(getOption("address"))
        .action(setParsed("common")),
    )
    .addCommand(
      new Command("upload_contract")
        .description("Upload figaro contract code to node")
        .addOption(getOption("secretKey"))
        .action(setParsed("common")),
    )
    .addCommand(
      new Command("cw20_instantiate")
        .description("Basic command for instantite new cw20 contract on node")
        .addOption(getOption("contractCodeId", true))
        .addOption(getOption("secretKey"))
        .addOption(getOption("initial_balances"))
        .addOption(getOption("minter"))
        .addOption(getOption("decimals"))
        .addOption(getOption("symbol"))
        .addOption(getOption("name"))
        .action(setParsed("common")),
    )
    .addCommand(
      new Command("info")
        .description("Contract query for get some details")
        .addOption(getOption("contractAddress"))
        .addOption(getOption("secretKey"))
        .addOption(getOption("contractQuery"))
        .action(setParsed("common")),
    )

  // prettier-ignore
  program
    .addCommand(sender)
    .addCommand(courier)
    .addCommand(common)

  program.parse(argv)
  
  // merge global options
  assign(parsed.options, program.optsWithGlobals())

  return parsed
}
