#!/usr/bin/env node
import { Command } from "commander"
import { getDescription, handleNpm, handlePrettier } from "./utils/index"

const name = "☃️  Snowye ❄️ "

const program = new Command()

program.name(name)

program.command("prettier").description(getDescription("Prettier格式化所有js,ts,jsx,tsx,css,less,json文件")).action(handlePrettier)

program.command("npm").description(getDescription("设置npm源")).action(handleNpm)

program.parse()
