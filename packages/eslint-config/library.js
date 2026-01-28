/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['./index.js'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
  },
};
