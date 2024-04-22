#!/usr/bin/env node
import { getDescription, handlePrettier } from "./utils/index"
import { Command } from "commander"
import { input } from "@inquirer/prompts"

const name = "☃️  Snowye ❄️ "

const program = new Command()

program.name(name)

program
    .command("prettier")
    .description(getDescription("Prettier格式化所有js,ts,jsx,tsx,css,less,json文件"))
    .action(async () => {
        const result = await input({ message: "选择过滤的文件夹 空格隔开" })
        handlePrettier(result.split(" "))
    })

program.parse()
