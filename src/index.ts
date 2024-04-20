import { select } from "@inquirer/prompts"
import chalk from "chalk"
import { handlePrettier } from "./utils/index"

const theme = {
    prefix: "☃️  Snowye ❄️ ",
    icon: {
        cursor: "❄️ "
    }
}

function getDescription(text: string) {
    return chalk.white.bgBlue.bold(" 🚀 " + text + " 🚀 ")
}

type Command = "PrettierAll"

const choices = [
    {
        name: "PrettierAll",
        value: "PrettierAll",
        description: getDescription("Prettier格式化所有js,ts,jsx,tsx,css,less,json文件")
    }
]

const handleMap: Record<Command, () => Promise<void>> = {
    PrettierAll: handlePrettier
}

select({
    message: "请选择你要执行的命令",
    theme,
    choices
}).then(res => {
    handleMap[res as Command]()
})
