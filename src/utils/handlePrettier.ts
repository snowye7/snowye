import { input } from "@inquirer/prompts"
import { readFileSync, writeFileSync } from "fs"
import path from "path"
import prettier, { Options } from "prettier"
import { cwd } from "process"
import { createProgress, getAllFilesInDirectory, getErrorText } from "."
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
        trailingComma: "none",
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
                filepath: file,
            })
            writeFileSync(file, formatted)
        },
        onError: index => {
            console.log(getErrorText(`Error: ${prettierFiles[index]} 文件格式化失败`))
        },
    })
}
