module.exports = {
    transform: {
        '.(ts|tsx)': 'ts-jest',
    },
    testEnvironment: 'jsdom',
    testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$',
    moduleFileExtensions: [
        'ts',
        'tsx',
        'js',
    ],
    collectCoverage: true,
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/distribution/',
    ],
    coverageThreshold: {
        global: {
            branches: 0,
            functions: 0,
            lines: 0,
            statements: 0,
            // branches: 90,
            // functions: 95,
            // lines: 95,
            // statements: 95
        },
    },
    collectCoverageFrom: [
        'source/*.{js,ts}',
    ],
    moduleDirectories: [
        'node_modules',
        'source',
    ],
    moduleNameMapper: {
        "data/(.*)": "<rootDir>/source/data/$1",
        "objects/(.*)": "<rootDir>/source/objects/$1",
        "utilities/(.*)": "<rootDir>/source/utilities/$1",
    },
};
