const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
        '^uuid$': '<rootDir>/node_modules/uuid/dist/index.js'
    },
    testMatch: ['**/__tests__/**/*.test.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/modules/ai/__tests__/setup.ts'],
    verbose: true,
    forceExit: false,
    clearMocks: true,
    resetModules: false,
    restoreMocks: true,
    maxWorkers: 1,
};
