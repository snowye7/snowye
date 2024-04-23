#!/usr/bin/env node
import { Command } from "commander"
import { getDescription, handleNpm, handlePrettier } from "./utils/index"
import chalk from "chalk"
import packageJson from "../package.json"

const program = new Command()

const version = packageJson.version

const name = chalk.white.bgCyan.bold(" ☃️  Snowye V " + version + " ")

program.name(name).version(version, "-v, --version output the version number")

program.command("prettier").description(getDescription("Prettier格式化所有js,ts,jsx,tsx,css,less,json文件")).action(handlePrettier)

program.command("npm").description(getDescription("设置npm源")).action(handleNpm)

program.parse()
