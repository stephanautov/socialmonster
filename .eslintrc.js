module.exports = {
  extends: [
    'next/core-web-vitals'
  ],
  rules: {
    // Disable problematic rules for deployment
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off'
  },
  ignorePatterns: [
    '.next/',
    'node_modules/',
    'dist/',
    'build/',
    '*.config.js',
    '*.config.ts'
  ]
}