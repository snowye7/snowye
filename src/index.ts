#!/usr/bin/env node
import { Command } from "commander"
import { getDescription, handleNpm, handlePrettier } from "./utils/index"
import chalk from "chalk"

const program = new Command()

const version = require("../package.json").version

const name = chalk.white.bgBlue(" ☃️  Snowye V " + version + " ")

program.name(name).version(version, "-v, --version output the version number")

program.command("prettier").description(getDescription("Prettier格式化所有js,ts,jsx,tsx,css,less,json文件")).action(handlePrettier)

program.command("npm").description(getDescription("设置npm源")).action(handleNpm)

program.parse()
