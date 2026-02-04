import { select } from "@inquirer/prompts"
import chalk from "chalk"
import cliProgress from "cli-progress"
import { readdirSync, readFileSync, statSync } from "fs"
import { readdir } from "fs/promises"
import path from "path"
import { cwd } from "process"
import { primary } from "../index"

export const theme = {
    icon: {
        cursor: "❄️ ",
    },
}

export enum PackageManager {
    npm = "npm",
    yarn = "yarn",
    pnpm = "pnpm",
    bun = "bun",
}

export enum PackageManagerInstall {
    npm = "npm install",
    yarn = "yarn add",
    pnpm = "pnpm add",
    bun = "bun install",
}

export enum BuildTool {
    rsbuild = "rsbuild",
    vite = "vite",
}

export function getPrimaryText(text: string) {
    return chalk.white.bgHex(primary).bold(text)
}

export function getErrorText(text: string) {
    return chalk.white.bgRed(" Error ") + " " + chalk.bold(text)
}

export function getSuccessText(text: string) {
    return " ✅ " + chalk.greenBright(text)
}

export function getWarningText(text: string) {
    return " ⚠️ " + chalk.yellowBright(text)
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
    if (dir.includes("bun.lockb")) return PackageManager.bun
    if (dir.includes("bun.lock")) return PackageManager.bun
    if (dir.includes("pnpm-lock.yaml")) return PackageManager.pnpm
    if (dir.includes("yarn.lock")) return PackageManager.yarn
    if (dir.includes("package-lock.json")) return PackageManager.npm
    return await select({
        message: "选择包管理器",
        theme,
        choices: [
            {
                name: "pnpm",
                value: PackageManager.pnpm,
            },
            {
                name: "yarn",
                value: PackageManager.yarn,
            },
            {
                name: "bun",
                value: PackageManager.bun,
            },
            {
                name: "npm",
                value: PackageManager.npm,
            },
        ],
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
                value: BuildTool.rsbuild,
            },
            {
                name: "vite",
                value: BuildTool.vite,
            },
        ],
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
            hideCursor: true,
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
