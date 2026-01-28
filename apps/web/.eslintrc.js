/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ['@trackpro/eslint-config/next', 'next/core-web-vitals'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
