import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import path from "path"
import { cwd } from "process"
import { getSuccessText, getErrorText, getWarningText } from "./index"

export const handleVscode = async () => {
    try {
        const vscodeDir = path.join(cwd(), ".vscode")
        if (!existsSync(vscodeDir)) {
            mkdirSync(vscodeDir)
        }
        const settingsPath = path.join(vscodeDir, "settings.json")
        const newSettings: Record<string, any> = {
            "editor.formatOnSave": true,
            "editor.defaultFormatter": "esbenp.prettier-vscode",
            "[typescript]": {
                "editor.defaultFormatter": "esbenp.prettier-vscode"
            },
            "[typescriptreact]": {
                "editor.defaultFormatter": "esbenp.prettier-vscode"
            },
            "[javascript]": {
                "editor.defaultFormatter": "esbenp.prettier-vscode"
            },
            "[javascriptreact]": {
                "editor.defaultFormatter": "esbenp.prettier-vscode"
            },
            "[vue]": {
                "editor.defaultFormatter": "esbenp.prettier-vscode"
            },
            "[json]": {
                "editor.defaultFormatter": "esbenp.prettier-vscode"
            }
        }

        let finalSettings = newSettings

        if (existsSync(settingsPath)) {
            try {
                const existingContent = readFileSync(settingsPath, "utf-8")
                if (existingContent.trim()) {
                    const existingSettings = JSON.parse(existingContent)
                    finalSettings = { ...existingSettings }

                    for (const [key, value] of Object.entries(newSettings)) {
                        if (typeof value === 'object' && value !== null && !Array.isArray(value) && 
                            typeof finalSettings[key] === 'object' && finalSettings[key] !== null && !Array.isArray(finalSettings[key])) {
                            finalSettings[key] = { ...finalSettings[key], ...value }
                        } else {
                            finalSettings[key] = value
                        }
                    }
                    console.log(getSuccessText("检测到已有 .vscode/settings.json，已合并配置"))
                }
            } catch (e) {
                console.log(getWarningText("无法解析现有的 settings.json（可能包含注释或格式错误），跳过修改"))
                console.error(e)
                return
            }
        } else {
            console.log(getSuccessText("成功创建 .vscode/settings.json"))
        }

        writeFileSync(settingsPath, JSON.stringify(finalSettings, null, 4))
    } catch (error) {
        console.log(getErrorText("操作 .vscode/settings.json 失败"))
        console.error(error)
    }
}
