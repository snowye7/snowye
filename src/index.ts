#!/usr/bin/env node
import { Command } from "commander"
import { getPrimaryText, handleNpm, handlePrettier } from "./utils/index"
import chalk from "chalk"
import packageJson from "../package.json"

export const primary = "#2472c8"

const program = new Command()

const version = packageJson.version

const name = getPrimaryText(" ☃️  Snowye V " + version + " ")

program.name(name).version(version, "-v, --version output the version number")

program.command("prettier").description(getPrimaryText("🚀-Prettier格式化所有js,ts,jsx,tsx,css,less,json文件")).action(handlePrettier)

program.command("npm").description(getPrimaryText("🚀-设置npm源")).action(handleNpm)

program.parse()
