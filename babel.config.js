module.exports = require("lundle").babelConfig("module", {
  react: true,
  plugins: [
    ["@babel/plugin-transform-typescript", { allowDeclareFields: true }],
  ],
});
