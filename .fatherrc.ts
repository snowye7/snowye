import { defineConfig } from "father"

export default defineConfig({
    cjs: {
        output: "dist"
    },
    targets: {
        node: 18,
        chrome: 100
    },
    sourcemap: true
})
