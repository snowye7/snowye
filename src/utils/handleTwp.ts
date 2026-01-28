import { select } from "@inquirer/prompts"
import { spawn } from "child_process"
import { readFileSync, writeFileSync } from "fs"
import { unlink } from "fs/promises"
import path from "path"
import prettier from "prettier"
import { cwd } from "process"
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

    console.log("正在安装依赖")
    const deps = [
        "prettier",
        "prettier-plugin-organize-imports",
        "prettier-plugin-tailwindcss",
        "@ianvs/prettier-plugin-sort-imports"
    ]
    const child = spawn(installCommand[0], [...installCommand.slice(1), "-D", ...deps], {
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
        if (code === 0) {
            // Create .prettierrc.json
            const prettierConfigJson = {
                semi: false,
                tabWidth: 4,
                arrowParens: "avoid",
                printWidth: 160,
                endOfLine: "lf",
                plugins: [
                    "@ianvs/prettier-plugin-sort-imports",
                    "prettier-plugin-tailwindcss"
                ]
            }
            writeFileSync(".prettierrc.json", JSON.stringify(prettierConfigJson, null, 4))

            // Create .prettierrc.mjs
            const prettierConfigMjs = `const config = {
    semi: false,
    tabWidth: 4,
    arrowParens: "avoid",
    printWidth: 160,
    endOfLine: "lf",
    plugins: ["prettier-plugin-organize-imports"],
}

export default config
`
            writeFileSync(".prettierrc.mjs", prettierConfigMjs)

            // Update package.json
            try {
                const packageJsonPath = path.join(cwd(), "package.json")
                const packageJsonContent = readFileSync(packageJsonPath, "utf-8")
                const packageJson = JSON.parse(packageJsonContent)

                if (!packageJson.scripts) {
                    packageJson.scripts = {}
                }
                packageJson.scripts["format"] = "prettier --config .prettierrc.json --write . && prettier --config .prettierrc.mjs --write ."

                writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4))
                console.log(getSuccessText("package.json scripts 更新成功"))
            } catch (error) {
                console.error(getErrorText("更新 package.json 失败: " + error))
            }

            console.log(getSuccessText("安装完成"))
        } else {
            console.error(getErrorText(`安装过程出错，退出码 ${code}`))
        }
    })
}
