export default {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: "<rootDir>/tsconfig.jest.json",
    }],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "\\.(css|scss|svg)$": "<rootDir>/__mocks__/styleMock.js",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/core/**/*.ts",
    "src/server/**/*.ts",
    "src/client/**/*.tsx",
  ],
  coverageDirectory: "<rootDir>/coverage",
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
  testPathIgnorePatterns: [
    "<rootDir>/src/components/", // Ignore React components for now
  ],
};
