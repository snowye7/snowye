import { readdirSync, statSync, readFileSync, writeFileSync, unlinkSync } from "fs"
import prettier, { Options } from "prettier"
import path from "path"
import chalk from "chalk"
import cliProgress from "cli-progress"
import { exec, spawn } from "child_process"
import { input, select } from "@inquirer/prompts"
import { primary } from "../index"
import { readdir, unlink } from "fs/promises"
import { cwd } from "process"

const theme = {
    icon: {
        cursor: "❄️ "
    }
}

enum PackageManager {
    npm = "npm",
    yarn = "yarn",
    pnpm = "pnpm"
}

enum PackageManagerInstall {
    npm = "npm install",
    yarn = "yarn add",
    pnpm = "pnpm add"
}

enum BuildTool {
    rsbuild = "rsbuild",
    vite = "vite"
}

export function getPrimaryText(text: string) {
    return chalk.white.bgHex(primary).bold(text)
}

export function getErrorText(text: string) {
    return chalk.white.bgRed.bold("Error") + text
}

export function getSuccessText(text: string) {
    return " ✅ " + chalk.greenBright(text)
}

export function getAllFilesInDirectory(directory: string, filters: string[] = []) {
    const reg = /\.(js|ts|jsx|tsx|css|less|json|sass|html|cjs|mjs)$/
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

export function readPackageJson(): Record<string, any> {
    const packageJsonPath = path.join(cwd(), "package.json")
    const packageJson = readFileSync(packageJsonPath, "utf-8")
    return JSON.parse(packageJson)
}

export async function getPackageManager(): Promise<PackageManager> {
    const dir = await readdir("./")
    if (dir.includes("yarn.lock")) return PackageManager.yarn
    if (dir.includes("package-lock.json")) return PackageManager.npm
    if (dir.includes("pnpm-lock.yaml")) return PackageManager.pnpm
    return await select({
        message: "选择包管理器",
        theme,
        choices: [
            {
                name: "pnpm",
                value: PackageManager.pnpm
            },
            {
                name: "yarn",
                value: PackageManager.yarn
            },
            {
                name: "npm",
                value: PackageManager.npm
            }
        ]
    })
}

export async function getBuildTool(): Promise<BuildTool> {
    const packageJson = readPackageJson()
    if (packageJson.devDependencies.vite) return BuildTool.vite
    if (packageJson.devDependencies["@rsbuild/core"]) return BuildTool.rsbuild
    return await select({
        message: "选择构建工具",
        theme,
        choices: [
            {
                name: "rsbuild",
                value: BuildTool.rsbuild
            },
            {
                name: "vite",
                value: BuildTool.vite
            }
        ]
    })
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
    const srcDirectory = path.join(cwd())
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
        name: cwd().split("\\").pop() ?? "snowye-prettier",
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
            console.log(getErrorText(`Error: ${prettierFiles[index]} 文件格式化失败`))
        }
    })
}

export const handleNpm = async () => {
    exec("npm get registry", async (error, stdout) => {
        if (error) {
            console.log(getErrorText(`执行出错: ${error}`))
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
                console.log(getErrorText(`执行出错: ${error}`))
                return
            }
            console.log(getSuccessText(`设置成功,当前npm镜像源:${result}`))
        })
    })
}

export const handleExport = async () => {
    //获取当前目录下的所有文件
    const files = readdirSync(path.join(cwd()))

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
    console.log(getSuccessText("创建成功"))
}

export const handleTwc = async () => {
    const packageManager = await getPackageManager()
    const build = await getBuildTool()
    //src文件下创建index.css文件 添加tailwindcss的引入
    writeFileSync("src/index.css", "@tailwind base;\n@tailwind components;\n@tailwind utilities;")
    console.log(getSuccessText("index.css导入tailwindcss"))
    exec("npx tailwindcss init -p", async (error, stdout) => {
        if (error) {
            console.log(getErrorText(`init tailwindcss文件出错: ${error.message}`))
            return
        }
        if (build === "rsbuild") {
            writeFileSync(
                "tailwind.config.js",
                `
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {}
    },
    plugins: []
}

                    `
            )
            console.log(getSuccessText("rsbuild 创建Tailwindcss Config文件成功"))
            writeFileSync(
                "rspack.config.js",
                `
module.exports = {
    // ...
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ["postcss-loader"],
                type: "css"
            }
        ]
    }
}

                `
            )
            console.log(getSuccessText("配置rsbuild Tailwindcss成功"))
        } else {
            writeFileSync(
                "tailwind.config.js",
                `
    /** @type {import('tailwindcss').Config} */
     module.exports = {
         content: [
           "./index.html",
           "./src/**/*.{js,ts,jsx,tsx}",
         ],
         theme: {
             extend: {}
         },
         plugins: []
     }
                    `
            )
            console.log(getSuccessText("配置vite Tailwindcss成功"))
        }

        const installCommand = PackageManagerInstall[packageManager].split(" ")

        const arr = [...installCommand.slice(1), "-D", "tailwindcss", "postcss", "autoprefixer"]

        if (build === "rsbuild") {
            arr.push("postcss-loader")
        }

        const child = spawn(installCommand[0], arr, {
            stdio: "pipe",
            shell: true
        })

        child.stdout.on("data", data => {
            process.stdout.write(data)
        })

        child.stderr.on("data", data => {
            process.stderr.write(data)
        })

        child.on("close", code => {
            if (code === 0) {
                console.log(getSuccessText("安装完成"))
            } else {
                console.error(getErrorText(`安装过程出错，退出码 ${code}`))
            }
        })
    })
}

export const handleTwp = async () => {
    const prettierConfigFile = await prettier.resolveConfigFile()
    if (prettierConfigFile) {
        const isDelete = await select({
            message: "检测到已有prettier配置文件,是否删除?",
            theme,
            choices: [
                { name: "是", value: true },
                { name: "否", value: false }
            ]
        })
        if (isDelete) {
            await unlink(prettierConfigFile)
        }
    }
    const packageManager = await getPackageManager()

    const installCommand = PackageManagerInstall[packageManager].split(" ")

    const child = spawn(installCommand[0], [...installCommand.slice(1), "-D", "prettier", "prettier-plugin-tailwindcss"], {
        stdio: "pipe",
        shell: true
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
