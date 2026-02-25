/**
 * Jest 配置（TypeScript，Next.js App Router）
 *
 * 使用 ts-jest 直接转译 TypeScript，避免需要 Babel
 * moduleNameMapper 解析 @/* 路径别名
 */

import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          // 测试环境使用 CommonJS 模块（ts-jest 兼容）
          module: 'CommonJS',
          moduleResolution: 'node',
          esModuleInterop: true,
          strict: true,
        },
      },
    ],
  },
  // 全局 setup（可选）
  // globalSetup: './__tests__/setup.ts',
  testTimeout: 10000,
  clearMocks: true,
  // 收集覆盖率
  collectCoverageFrom: [
    'lib/payment/**/*.ts',
    'app/api/orders/**/*.ts',
    'app/api/cron/**/*.ts',
    'app/api/pad/**/*.ts',
    '!**/*.d.ts',
  ],
};

export default config;
