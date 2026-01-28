/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ['@trackpro/eslint-config/nest'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
