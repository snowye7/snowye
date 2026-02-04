import { exec, spawn } from "child_process"
import { writeFileSync } from "fs"
import { getBuildTool, getErrorText, getPackageManager, getSuccessText, PackageManagerInstall } from "."


export const handleTwc = async () => {
    const packageManager = await getPackageManager()
    const build = await getBuildTool()
    //src文件下创建index.css文件 添加tailwindcss的引入
    writeFileSync("src/index.css", "@tailwind base;\n@tailwind components;\n@tailwind utilities;")
    console.log(getSuccessText("index.css导入tailwindcss变量成功"))
    exec("npx tailwindcss@3.4.17 init -p", async error => {
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
            console.log(getSuccessText("rsbuild 创建tailwindcss config文件成功"))
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
            writeFileSync(
                "src/index.tsx",
                `
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

const rootEl = document.getElementById("root")
if (rootEl) {
    const root = ReactDOM.createRoot(rootEl)
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    )
}

                `
            )
            console.log(getSuccessText("配置rsbuild tailwindcss成功"))
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

        console.log("正在安装依赖")

        const installCommand = PackageManagerInstall[packageManager].split(" ")

        const arr = [...installCommand.slice(1), "-D", "tailwindcss@3.4.17", "postcss", "autoprefixer"]

        if (build === "rsbuild") {
            arr.push("postcss-loader")
        }

        const child = spawn(installCommand[0], arr, {
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
                console.log(getSuccessText("安装完成"))
            } else {
                console.error(getErrorText(`安装过程出错，退出码 ${code}`))
            }
        })
    })
}
