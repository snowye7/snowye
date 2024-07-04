#!/usr/bin/env node
import { Command } from "commander"
import packageJson from "../package.json"
import { getPrimaryText, handleExport, handleNpm, handlePrettier, handleTwc, handleTwp } from "./utils/index"

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

program.parse()
