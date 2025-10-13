// .eslintrc.cjs
module.exports = {
  root: true,
  ignorePatterns: ['dist/'],

  // Use the TypeScript parser
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: ['./tsconfig.json'], // needed for some rules (type-aware linting)
    tsconfigRootDir: __dirname,
    ecmaFeatures: { jsx: true },
  },

  settings: {
    react: { version: 'detect' },
    'import/resolver': {
      // ensures path aliases from tsconfig.json are resolved
      typescript: {
        project: './tsconfig.json',
      },
    },
  },

  plugins: [
    '@typescript-eslint',
    'react-hooks',
    'react-refresh',
    'prettier'
  ],

  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:react-refresh/recommended',
    'plugin:prettier/recommended'
  ],

  env: {
    browser: true,
    es2021: true,
    node: true
  },

  rules: {
    // Prettier
    'prettier/prettier': 'error',

    // example: allow TS "import type" ordering if you want
    // '@typescript-eslint/consistent-type-imports': 'error',

    // react hooks safety
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // add or override project-specific rules here
  },

  overrides: [
    {
      files: ['**/*.tsx', '**/*.jsx'],
      rules: {
        // React-specific adjustments for JSX files
      },
    },
    {
      files: ['**/*.ts', '**/*.tsx'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        // enable type-aware rules if you want (requires parserOptions.project)
        // 'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      rules: {
        // TS-specific rule overrides
      },
    },
  ],
};
