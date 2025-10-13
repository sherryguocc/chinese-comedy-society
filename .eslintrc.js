module.exports = {
  parser: '@typescript-eslint/parser', // 使用 TypeScript 解析器
  parserOptions: {
    project: './tsconfig.json', // 告诉 ESLint 去哪里找类型信息
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended', // 启用推荐规则
    'plugin:@typescript-eslint/recommended-requiring-type-checking' // 启用类型检查规则！
  ],
  rules: {
    // 自定义规则（例如禁止 any）
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
