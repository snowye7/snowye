import { readdirSync, statSync, readFileSync, writeFileSync } from "fs"
import prettier, { Options } from "prettier"
import path from "path"
import chalk from "chalk"
import cliProgress from "cli-progress"

export function getDescription(text: string) {
    return chalk.white.bgBlue.bold(" 🚀 " + text + " 🚀 ")
}

function getAllFilesInDirectory(directory: string, filters: string[] = []) {
    const reg = /\.(js|ts|jsx|tsx|css|less|(?!json.gz|json.br$)json|sass)$/
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

export async function createProgress(name: string, total: number, onProgress: (index: number) => Promise<void>, onError?: (index: number) => void) {
    const bar = new cliProgress.SingleBar(
        {
            format: `${name} | ${chalk.cyan("{bar}")}  | {percentage}% || ${chalk.greenBright("{value}")}/${chalk.black("{total}")} Chunks`,
            barCompleteChar: "\u2588",
            barIncompleteChar: "\u2591",
            hideCursor: true
        },
        cliProgress.Presets.shades_classic
    )

    bar.start(total, 0)

    for (let index = 0; index < total; index++) {
        try {
            await onProgress(index)
            bar.update(index + 1)
        } catch (error) {
            bar.stop()
            console.log("\n")
            onError && onError(index)
            console.error(error)
            return
        }
    }
    bar.stop()
}

export const handlePrettier = async (filterFile: string[]) => {
    const srcDirectory = path.join(process.cwd())
    const prettierFiles = getAllFilesInDirectory(srcDirectory, filterFile)
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
    createProgress(
        "snowye-prettier",
        prettierFiles.length,
        async index => {
            const file = prettierFiles[index]
            const source = readFileSync(file, "utf-8")
            const formatted = await prettier.format(source, {
                ...Config,
                filepath: file,
                ignoreGlobs: ["**/*.json.gz"]
            })
            writeFileSync(file, formatted)
        },
        index => {
            console.log(" ❌ " + chalk.redBright(`Error: ${prettierFiles[index]} 文件格式化失败`))
        }
    )
}
