import { spawn } from "child_process"
import { readFileSync, writeFileSync } from "fs"
import path from "path"
import { cwd } from "process"
import { getErrorText, getPackageManager, getSuccessText, PackageManagerInstall } from "."

export const handleHusky = async () => {
    const packageManager = await getPackageManager()

    console.log("正在安装依赖")
    const installCmd = PackageManagerInstall[packageManager].split(" ")
    const deps = ["husky", "lint-staged"]

    // Install dependencies
    await new Promise<void>((resolve, reject) => {
        const child = spawn(installCmd[0], [...installCmd.slice(1), "-D", ...deps], {
            stdio: "pipe",
            shell: true,
        })

        child.stdout.on("data", data => {
            process.stdout.write(data)
        })

        child.stderr.on("data", data => {
            process.stderr.write(data)
        })

        child.on("close", (code) => {
            if (code === 0) {
                resolve()
            } else {
                reject(new Error(`依赖安装失败，退出码: ${code}`))
            }
        })
    })

    console.log("正在初始化 Husky")
    let initCmd = "npx husky init"
    if (packageManager === "pnpm") initCmd = "pnpm exec husky init"
    if (packageManager === "bun") initCmd = "bunx husky init"
    if (packageManager === "yarn") initCmd = "npx husky init"

    try {
        await new Promise<void>((resolve, reject) => {
             const child = spawn(initCmd, [], {
                stdio: "pipe",
                shell: true,
            })

            child.stdout.on("data", data => {
                process.stdout.write(data)
            })

            child.stderr.on("data", data => {
                process.stderr.write(data)
            })

            child.on("close", (code) => {
                if (code === 0) resolve()
                else reject(new Error(`Husky init failed`))
            })
        })
    } catch (e) {
        console.error(getErrorText("Husky 初始化失败"))
        return
    }

    // Configure pre-commit
    try {
        const preCommitPath = path.join(cwd(), ".husky", "pre-commit")
        writeFileSync(preCommitPath, "npx lint-staged\n")
    } catch (e) {
         console.error(getErrorText("创建 pre-commit hook 失败"))
    }

    // Configure package.json
    try {
        const packageJsonPath = path.join(cwd(), "package.json")
        const packageJsonContent = readFileSync(packageJsonPath, "utf-8")
        const packageJson = JSON.parse(packageJsonContent)

        packageJson["lint-staged"] = {
            "*.{js,ts,tsx,jsx,json,mjs,cjs,vue}": [
                "prettier --config .prettierrc.json --write",
                "prettier --config .prettierrc.mjs --write"
            ]
        }

        writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4))
        console.log(getSuccessText("package.json lint-staged 配置更新成功"))
    } catch (error) {
        console.error(getErrorText("更新 package.json 失败: " + error))
    }

    console.log(getSuccessText("Husky 配置完成"))
}
