#!/usr/bin/env node
import { Command } from "commander"
import packageJson from "../package.json"
import { getPrimaryText } from "./utils/index"
import { handleNpm } from "./utils/handleNpm"
import { handleTwc } from "./utils/handleTwc"
import { handleExport } from "./utils/handleExport"
import { handlePrettier } from "./utils/handlePrettier"
import { handleTwp } from "./utils/handleTwp"
import { handleApf } from "./utils/handleApf"
import { handleHusky } from "./utils/handleHusky"
import { handleVscode } from "./utils/handleVscode"

export const primary = "#2472c8"

const program = new Command()

const version = packageJson.version

const name = getPrimaryText(" ☃️  Snowye V " + version + " ")

program.name(name).version(version, "-v, --version output the version number")

program.command("prettier").description(getPrimaryText("🚀-Prettier格式化所有js,ts,jsx,tsx,css,less,json文件")).action(handlePrettier)

program.command("npm").description(getPrimaryText("🚀-设置npm源")).action(handleNpm)

program.command("export").description(getPrimaryText("🚀-创建统一导出export的桶文件(默认ts)")).action(handleExport)

program.command("tailwindcssConfig").alias("twc").description(getPrimaryText("🚀-一键配置tailwindcss")).action(handleTwc)

program.command("tailwindcssPrettier").alias("twp").description(getPrimaryText("🚀-配置prettier文件 包含tailwindcss格式化插件")).action(handleTwp)

program.command("addProjectFiles").alias("apf").description(getPrimaryText("🚀-添加项目文件")).action(handleApf)

program.command("husky").description(getPrimaryText("🚀-配置husky和lint-staged")).action(handleHusky)

program.command("vue-prettier").alias("vp").description(getPrimaryText("🚀-生成.vscode/settings.json配置,让prettier接管vue的格式化")).action(handleVscode)

program.parse()
