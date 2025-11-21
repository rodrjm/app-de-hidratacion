module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'jsx-a11y'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended'
  ],
  settings: {
    react: { version: 'detect' }
  },
  env: {
    browser: true,
    es2022: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'jsx-a11y/anchor-is-valid': 'warn',
    'jsx-a11y/no-static-element-interactions': 'off'
  },
  overrides: [
    {
      files: ['src/tests/**/*'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'jsx-a11y/label-has-associated-control': 'off'
      }
    },
    {
      files: ['src/**/*'],
      excludedFiles: ['src/tests/**/*'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        'jsx-a11y/label-has-associated-control': 'warn'
      }
    },
    // Ensure tests override wins
    {
      files: ['src/tests/**/*'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
};



