#!/usr/bin/env node

import "reflect-metadata"

import * as process from "process"

import { extendsConfig } from "./config"
import { cli } from "./cli"

async function main() {
  try {
    extendsConfig()
    await cli()
  } finally {
    process.exit(0)
  }
}

main()
