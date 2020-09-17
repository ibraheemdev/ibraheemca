'use strict';

const babelOptions = {
  presets: [
    '@babel/react',
    '@babel/env',
    'babel-preset-gatsby',
    '@babel/preset-typescript'
  ],
};

module.exports = require('babel-jest').createTransformer(babelOptions);
