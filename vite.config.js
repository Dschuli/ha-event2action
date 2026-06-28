const { defineConfig } = require("vite");
const { resolve } = require("path");

module.exports = defineConfig({
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
