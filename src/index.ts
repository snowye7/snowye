#!/usr/bin/env node
import { getDescription, handlePrettier } from "./utils/index"
import { Command } from "commander"

const name = "☃️  Snowye ❄️ "

const program = new Command()

program.name(name)

program.command("prettier").description(getDescription("Prettier格式化所有js,ts,jsx,tsx,css,less,json文件")).action(handlePrettier)

program.parse()
