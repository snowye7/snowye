import { select } from "@inquirer/prompts"
import { spawn } from "child_process"
import { writeFileSync } from "fs"
import { unlink } from "fs/promises"
import prettier from "prettier"
import { getErrorText, getPackageManager, getSuccessText, PackageManagerInstall, theme } from "."

export const handleTwp = async () => {
    const prettierConfigFile = await prettier.resolveConfigFile()
    if (prettierConfigFile) {
        const isDelete = await select({
            message: "检测到已有prettier配置文件,是否删除?",
            theme,
            choices: [
                { name: "是", value: true },
                { name: "否", value: false },
            ],
        })
        if (isDelete) {
            await unlink(prettierConfigFile)
        }
    }
    const packageManager = await getPackageManager()

    const installCommand = PackageManagerInstall[packageManager].split(" ")

    const child = spawn(installCommand[0], [...installCommand.slice(1), "-D", "prettier", "prettier-plugin-tailwindcss"], {
        stdio: "pipe",
        shell: true,
    })

    child.stdout.on("data", data => {
        process.stdout.write(data)
    })

    child.stderr.on("data", data => {
        process.stderr.write(data)
    })

    child.on("close", code => {
        writeFileSync(
            ".prettierrc",
            `
{
    "plugins": ["prettier-plugin-tailwindcss"],
    "semi": false,
    "tabWidth": 4,
    "arrowParens": "avoid",
    "printWidth": 800,
    "trailingComma": "none"
}
    `
        )
        if (code === 0) {
            console.log(getSuccessText("安装完成"))
        } else {
            console.error(getErrorText(`安装过程出错，退出码 ${code}`))
        }
    })
}
