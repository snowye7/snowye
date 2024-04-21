import { readdirSync, statSync, readFileSync, writeFileSync } from "fs"
import prettier, { Options } from "prettier"
import path from "path"
import chalk from "chalk"
import cliProgress from "cli-progress"

export function getDescription(text: string) {
    return chalk.white.bgBlue.bold(" 🚀 " + text + " 🚀 ")
}

function getAllFilesInDirectory(directory: string) {
    const reg = /\.(js|ts|jsx|tsx|css|less|json|sass)$/
    const files: string[] = []
    const items = readdirSync(directory)
    const ignore = ["node_modules", "dist"]
    items.forEach(item => {
        const fullPath = path.join(directory, item)
        if (!ignore.includes(item)) {
            if (statSync(fullPath).isFile()) {
                if (reg.test(fullPath)) {
                    files.push(fullPath)
                }
            } else {
                const subFiles = getAllFilesInDirectory(fullPath)
                files.push(...subFiles)
            }
        }
    })

    return files
}

export const handlePrettier = async () => {
    const bar = new cliProgress.SingleBar(
        {
            format: `snowye-prettier | ${chalk.cyan("{bar}")}  | {percentage}% || ${chalk.greenBright("{value}")}/${chalk.black("{total}")} Chunks`,
            barCompleteChar: "\u2588",
            barIncompleteChar: "\u2591",
            hideCursor: true
        },
        cliProgress.Presets.shades_classic
    )
    const srcDirectory = path.join(process.cwd())
    const prettierFiles = getAllFilesInDirectory(srcDirectory)
    bar.start(prettierFiles.length, 0)
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
    for (let i = 0; i < prettierFiles.length; i++) {
        const file = prettierFiles[i]
        const source = readFileSync(file, "utf-8")
        const formatted = await prettier.format(source, {
            ...Config,
            filepath: file
        })
        writeFileSync(file, formatted)
        bar.update(i + 1)
    }
    bar.stop()
}
