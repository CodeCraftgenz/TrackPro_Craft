/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ['@trackpro/eslint-config/next'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
