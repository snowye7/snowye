import { checkbox } from "@inquirer/prompts"
import { writeFileSync } from "fs"
import { mkdir, readdir } from "fs/promises"
import path from "path"
import { cwd } from "process"
import { getErrorText, getSuccessText, getWarningText } from "."
export const handleApf = async () => {
    const addFiles = ["api", "assets", "components", "hooks", "pages", "utils", "store"]

    const result = await checkbox({
        message: "选择添加的文件夹",
        choices: addFiles.map(it => {
            return { name: it, value: it, checked: true }
        }),
        pageSize: addFiles.length,
    })

    if (!result.length) {
        console.log(getWarningText("未选择文件夹"))
        return
    }

    const files = await readdir("./src")

    const add = result.filter(it => !files.includes(it))

    if (!add.length) {
        console.log(getWarningText("文件夹都已存在"))
        return
    }

    const hasFiles = result.filter(it => files.includes(it))

    !!hasFiles.length && console.log(getWarningText(hasFiles.join(",") + "文件夹已存在,不会继续添加"))

    console.log(`正在添加${add.join("、")}`)

    for (let i = 0; i < add.length; i++) {
        const file = add[i]
        const _ = path.join(cwd(), "src", file)
        //创建文件夹
        const mkdirResult = await mkdir(_, { recursive: true })
        //给文件夹添加index.ts文件
        writeFileSync(path.join(_, "index.ts"), "")
        if (!mkdirResult) {
            console.log(getErrorText(`${file}文件夹创建失败`))
            continue
        }
        console.log(getSuccessText(`${file}文件夹创建成功`))
    }
}
