module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)test.ts', '**/?(*.)test.tsx', '**/?(*.)test.js', '**/?(*.)test.jsx'],
  transform: {
    '^.+\\.js?$': '<rootDir>/jest/jest-preprocess.js'
  },
  rootDir: '../',
  moduleNameMapper: {
    '.+\\.(css|styl|less|sass|scss)$': 'identity-obj-proxy',
    '.+\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/jest/__mocks__/file-mock.js'
  },
  setupFiles: ['<rootDir>/jest/loadershim.js']
};