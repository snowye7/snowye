import { select } from "@inquirer/prompts"
import { readdirSync, readFileSync, writeFileSync } from "fs"
import path from "path"
import { cwd } from "process"
import { getSuccessText, theme } from "."

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
                { name: "是", value: true },
            ],
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