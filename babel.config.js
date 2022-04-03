module.exports = require("lundle").babelConfig("test", {
  react: true,
  plugins: [
    ["@babel/plugin-transform-typescript", { allowDeclareFields: true }],
  ],
});
