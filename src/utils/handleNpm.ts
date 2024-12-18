import fs from "fs/promises"
import path from "path"
import os from "os"
import { select } from "@inquirer/prompts"
import chalk from "chalk"
import { getErrorText, getSuccessText, theme } from "."

export const handleNpm = async () => {
    const npmrcPath = path.join(os.homedir(), ".npmrc")

    try {
        // Read the current registry from .npmrc
        let currentRegistry = ""
        try {
            const npmrcContent = await fs.readFile(npmrcPath, "utf8")
            const registryLine = npmrcContent.split("\n").find(line => line.startsWith("registry="))
            currentRegistry = registryLine ? registryLine.split("=")[1].trim() : "https://registry.npmjs.org/"
        } catch (error) {
            // If .npmrc doesn't exist, assume default registry
            currentRegistry = "https://registry.npmjs.org/"
        }

        console.log(" 🐻 " + chalk.yellowBright("当前npm镜像源:" + currentRegistry))

        const result = await select({
            message: "选择npm镜像源",
            theme,
            choices: [
                { name: "默认", value: "https://registry.npmjs.org/" },
                { name: "淘宝", value: "https://registry.npmmirror.com" },
                { name: "阿里云", value: "https://npm.aliyun.com" },
                { name: "腾讯云", value: "http://mirrors.cloud.tencent.com/npm/" },
                { name: "华为云", value: "https://mirrors.huaweicloud.com/repository/npm/" },
            ],
        })

        // Update .npmrc file
        await fs.writeFile(npmrcPath, `registry=${result}\n`, "utf8")

        console.log(getSuccessText(`设置成功,当前npm镜像源:${result}`))
    } catch (error) {
        console.log(getErrorText(`执行出错: ${error}`))
    }
}
