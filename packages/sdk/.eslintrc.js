/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ['@trackpro/eslint-config/library'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  env: {
    browser: true,
  },
};
