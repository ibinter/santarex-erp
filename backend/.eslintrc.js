// Configuration ESLint TypeScript minimale et pragmatique pour le backend NestJS.
// Le build (`nest build` / tsc) N'exécute PAS ESLint : ce filet qualité est
// purement manuel via `npm run lint` et ne peut donc pas casser le build.
//
// NOTE : `eslint`, `@typescript-eslint/parser` et `@typescript-eslint/eslint-plugin`
// ne sont pas installés dans ce projet. Installez-les en devDependencies pour
// exécuter le lint :
//   npm i -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/', 'node_modules/', 'coverage/'],
  rules: {
    // Pragmatique : on ne veut pas casser le code métier existant.
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'no-unused-vars': 'off',
    'no-empty': 'warn',
    'no-console': 'off',
  },
};
