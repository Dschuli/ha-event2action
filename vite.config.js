const { defineConfig } = require("vite");
const { resolve } = require("path");

const { mkdirSync, copyFileSync } = require("fs");

module.exports = defineConfig({
  plugins: [{
    name: "bundle-integration-card",
    closeBundle() {
      const target = resolve(__dirname, "custom_components/event2action/frontend");
      mkdirSync(target, { recursive: true });
      copyFileSync(resolve(__dirname, "dist/event2action-learning-card.js"), resolve(target, "event2action-learning-card.js"));
    }
  }],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, "src/e2a-learning-card.js"),
      formats: ["es"],
      fileName: () => "event2action-learning-card.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
