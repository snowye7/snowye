import { readdirSync, statSync, readFileSync, writeFileSync } from "fs"
import prettier, { Options } from "prettier"
import path from "path"
import chalk from "chalk"
import cliProgress from "cli-progress"
import { exec } from "child_process"
import { input, select } from "@inquirer/prompts"
import { primary } from "../index"

const theme = {
    icon: {
        cursor: "❄️ "
    }
}

export function getPrimaryText(text: string) {
    return chalk.white.bgHex(primary).bold(text)
}

function getAllFilesInDirectory(directory: string, filters: string[] = []) {
    const reg = /\.(js|ts|jsx|tsx|css|less|json|sass|html)$/
    const files: string[] = []
    const items = readdirSync(directory)
    const ignore = ["node_modules", "dist", ...filters]
    items.forEach(item => {
        const fullPath = path.join(directory, item)
        if (!ignore.includes(item)) {
            if (statSync(fullPath).isFile()) {
                if (reg.test(fullPath)) {
                    files.push(fullPath)
                }
            } else {
                const subFiles = getAllFilesInDirectory(fullPath, filters)
                files.push(...subFiles)
            }
        }
    })

    return files
}

export type CreateProgressProps = {
    name: string
    total: number
    onProgress: (index: number) => Promise<void>
    onError?: (index: number) => void
    type?: cliProgress.Preset
}

export async function createProgress(props: CreateProgressProps) {
    const { name, total, onProgress, onError, type = cliProgress.Presets.shades_classic } = props
    const bar = new cliProgress.SingleBar(
        {
            format: `${chalk.white.bgGray(" " + name + " ")} | ${chalk.cyan("{bar}")}  | {percentage}% || ${chalk.greenBright("{value}")}/${chalk.blackBright("{total}")} Chunks`,
            barCompleteChar: "\u2588",
            barIncompleteChar: "\u2591",
            hideCursor: true
        },
        type
    )

    bar.start(total, 0)

    let errorIndex = 0
    try {
        for (let index = 0; index < total; index++) {
            errorIndex = index
            await onProgress(index)
            bar.update(index + 1)
        }
    } catch (error) {
        bar.stop()
        console.log("\n")
        onError && onError(errorIndex)
        console.error(error)
        return
    }
    bar.stop()
}

export const handlePrettier = async () => {
    const filterFile = await input({ message: "选择过滤的文件夹 空格隔开" })
    const srcDirectory = path.join(process.cwd())
    const prettierFiles = getAllFilesInDirectory(srcDirectory, filterFile.split(" "))
    const prettierConfigFile = await prettier.resolveConfigFile()
    let Config: Options = {
        semi: false,
        tabWidth: 4,
        arrowParens: "avoid",
        printWidth: 800,
        trailingComma: "none"
    }
    if (prettierConfigFile) {
        Config = (await prettier.resolveConfig(prettierConfigFile)) as Options
    }
    createProgress({
        name: process.cwd().split("\\").pop() ?? "snowye-prettier",
        total: prettierFiles.length,
        onProgress: async index => {
            const file = prettierFiles[index]
            const source = readFileSync(file, "utf-8")
            const formatted = await prettier.format(source, {
                ...Config,
                filepath: file
            })
            writeFileSync(file, formatted)
        },
        onError: index => {
            console.log(" ❌ " + chalk.redBright(`Error: ${prettierFiles[index]} 文件格式化失败`))
        }
    })
}

export const handleNpm = async () => {
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
        exec(`npm config set registry ${result}`, async (error, stdout) => {
            if (error) {
                console.error(`执行出错: ${error}`)
                return
            }
            console.log(" ✅ " + chalk.greenBright(`设置成功,当前npm镜像源:${result}`))
        })
    })
}

export const handleExport = async () => {
    //获取当前目录下的所有文件
    const files = readdirSync(path.join(process.cwd()))

    const indexFiles = ["index.js", "index.ts", "index.jsx", "index.tsx"]

    const indexFile = indexFiles.find(item => files.includes(item))

    const exportFiles = files.filter(item => !indexFiles.includes(item))

    const content = exportFiles.map(item => `export * from "./${item}"`).join("\n")

    if (indexFile) {
        // 读取index文件内容

        const isRemove = await select({
            message: "检测到已有index文件,是否清空?",
            theme,
            choices: [
                { name: "否", value: false },
                { name: "是", value: true }
            ]
        })
        if (isRemove) {
            writeFileSync(indexFile, content)
            return
        }
        const indexContent = readFileSync(indexFile, "utf-8")
        writeFileSync(indexFile, indexContent + "\n" + content)
        return
    }
    writeFileSync("index.ts", content)
}
