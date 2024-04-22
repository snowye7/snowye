#!/usr/bin/env node
import { getDescription, handlePrettier } from "./utils/index"
import { Command } from "commander"
import { input, select } from "@inquirer/prompts"
import chalk from "chalk"
import { exec } from "child_process"

const name = "☃️  Snowye ❄️ "

const theme = {
    icon: {
        cursor: "❄️ "
    }
}

const program = new Command()

program.name(name)

program
    .command("prettier")
    .description(getDescription("Prettier格式化所有js,ts,jsx,tsx,css,less,json文件"))
    .action(async () => {
        const result = await input({ message: "选择过滤的文件夹 空格隔开" })
        handlePrettier(result.split(" "))
    })

program
    .command("npm")
    .description(getDescription("设置npm源"))
    .action(async () => {
        exec("npm get registry", async (error, stdout) => {
            if (error) {
                console.error(`执行出错: ${error}`)
                return
            }
            console.log(" 🐻 " + chalk.yellowBright("当前npm镜像源:" + stdout))
            const result = await select({
                message: "选择npm镜像源",
                theme,
                choices: [
                    { name: "默认", value: "https://registry.npmjs.org/" },
                    { name: "淘宝", value: "https://registry.npmmirror.com" },
                    { name: "阿里云", value: "https://npm.aliyun.com" },
                    { name: "腾讯云", value: "http://mirrors.cloud.tencent.com/npm/" },
                    { name: "华为云", value: "https://mirrors.huaweicloud.com/repository/npm/" }
                ]
            })
            exec(`npm config set registry ${result}`)
        })
    })

program.parse()
