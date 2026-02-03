const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
        ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
    },
    testMatch: ['**/__tests__/**/*.test.ts'],
    setupFiles: ['<rootDir>/jest.polyfills.js'],
    setupFilesAfterEnv: ['<rootDir>/src/modules/ai/__tests__/setup.ts'],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetModules: false,
    restoreMocks: true,
    transform: {
        '^.+\\.[tj]sx?$': [
            'ts-jest',
            {
                isolatedModules: true,
            },
        ],
    },
    transformIgnorePatterns: [
        "/node_modules/(?!uuid)/"
    ],
    maxWorkers: 1,
};
