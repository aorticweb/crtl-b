const path = require("path");
const autoprefixer = require("autoprefixer");

module.exports = [
  {
    mode: "production",
    cache: false,
    // content script
    entry: "./src/content/index.tsx",
    output: {
      path: path.resolve(__dirname, "dist/target/content"),
      filename: "content.js",
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.tsx$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.(css)$/,
          use: [
            {
              // Adds CSS to the DOM by injecting a `<style>` tag
              loader: "style-loader",
            },
            {
              // Interprets `@import` and `url()` like `import/require()` and will resolve them
              loader: "css-loader",
            },
            {
              // Loader for webpack to process CSS with PostCSS
              loader: "postcss-loader",
              options: {
                postcssOptions: {
                  plugins: [autoprefixer],
                },
              },
            },
            {
              // Loads a SASS/SCSS file and compiles it to CSS
              loader: "sass-loader",
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"], // Resolve these file types
    },
  },
  {
    mode: "production",
    cache: false,
    target: "webworker",
    // background script
    entry: "./src/background/index.ts",
    output: {
      path: path.resolve(__dirname, "dist/target/background"),
      filename: "background.js",
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".js"], // Resolve these file types
    },
  },
];
