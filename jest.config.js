/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node', // Use 'node' environment for server-side code testing
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",
  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/src/lib/firebase.ts", // Exclude Firebase initialization
    "/src/components/ui/", // Exclude generated UI components
    "/src/hooks/use-mobile.tsx", // UI related hook
  ],
  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    // Handle module aliases (if you have them in tsconfig.json)
    '^@/(.*)$': '<rootDir>/src/$1',
     // Mock CSS Modules (or other static assets if needed)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  // The glob patterns Jest uses to detect test files
  testMatch: [
    "**/tests/**/*.test.ts",
    // "**/?(*.)+(spec|test).[tj]s?(x)" // Default pattern
  ],
  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json', // Use your project's tsconfig
      },
    ],
  },
  // Setup files after env
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Create this file if needed for global setup
  // Add any other necessary configurations
};